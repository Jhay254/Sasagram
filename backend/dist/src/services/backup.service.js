"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupService = exports.BackupService = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const logger_1 = __importDefault(require("../utils/logger"));
const execAsync = util_1.default.promisify(child_process_1.exec);
class BackupService {
    constructor() {
        this.backupDir = path_1.default.join(process.cwd(), 'backups');
        this.mediaDir = path_1.default.join(process.cwd(), 'uploads'); // Assuming uploads are here
        // Ensure backup directory exists
        if (!fs_1.default.existsSync(this.backupDir)) {
            fs_1.default.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    /**
     * Backup PostgreSQL database running in Docker
     */
    async backupDatabase() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-db-${timestamp}.sql.gz`;
        const filepath = path_1.default.join(this.backupDir, filename);
        // Command to run pg_dump inside the docker container
        // Note: This assumes the container name is 'lifeline-postgres' as defined in docker-compose
        const containerName = 'lifeline-postgres';
        const dbUser = process.env.DB_USER || 'lifeline';
        const dbName = process.env.DB_NAME || 'lifeline_db';
        logger_1.default.info(`Starting database backup: ${filename}`);
        try {
            // We use docker exec to run pg_dump inside the container and pipe output to a file on host
            // On Windows, we need to be careful with piping. 
            // We'll try a standard command that works in most shells.
            const command = `docker exec ${containerName} pg_dump -U ${dbUser} ${dbName} | gzip > "${filepath}"`;
            await execAsync(command);
            logger_1.default.info(`Database backup completed successfully: ${filepath}`);
            return filepath;
        }
        catch (error) {
            logger_1.default.error(`Database backup failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Backup Media files (uploads directory)
     * For now, we'll just zip the directory. In production, you'd sync to S3/R2.
     */
    async backupMedia() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-media-${timestamp}.zip`;
        const filepath = path_1.default.join(this.backupDir, filename);
        logger_1.default.info(`Starting media backup: ${filename}`);
        try {
            // Using tar to compress the directory (available on most systems including Win 10+ via tar.exe or git bash)
            // Alternatively, we could use a node library like 'archiver' for better cross-platform support.
            // Let's use 'archiver' if we were installing it, but to avoid deps for now, we'll try tar.
            // If tar isn't available, this might fail on old Windows, but User is on Windows 10/11 likely.
            // tar -czf target source
            const command = `tar -czf "${filepath}" -C "${path_1.default.dirname(this.mediaDir)}" "${path_1.default.basename(this.mediaDir)}"`;
            await execAsync(command);
            logger_1.default.info(`Media backup completed successfully: ${filepath}`);
            return filepath;
        }
        catch (error) {
            logger_1.default.error(`Media backup failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Clean up old backups (keep last 30 days)
     */
    async cleanupOldBackups(retentionDays = 30) {
        try {
            const files = fs_1.default.readdirSync(this.backupDir);
            const now = Date.now();
            const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
            let deletedCount = 0;
            for (const file of files) {
                const filepath = path_1.default.join(this.backupDir, file);
                const stats = fs_1.default.statSync(filepath);
                if (now - stats.mtimeMs > retentionMs) {
                    fs_1.default.unlinkSync(filepath);
                    deletedCount++;
                }
            }
            if (deletedCount > 0) {
                logger_1.default.info(`Cleaned up ${deletedCount} old backup files`);
            }
        }
        catch (error) {
            logger_1.default.error(`Backup cleanup failed: ${error.message}`);
        }
    }
}
exports.BackupService = BackupService;
exports.backupService = new BackupService();
