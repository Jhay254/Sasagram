"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCronJobs = initializeCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const token_refresh_service_1 = require("../services/token-refresh.service");
const pkce_service_1 = require("../services/pkce.service");
const backup_service_1 = require("../services/backup.service");
const logger_1 = __importDefault(require("../utils/logger"));
const tokenRefreshService = new token_refresh_service_1.TokenRefreshService();
function initializeCronJobs() {
    logger_1.default.info('Initializing cron jobs...');
    // Run token refresh every 6 hours
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        logger_1.default.info('Running scheduled token refresh...');
        try {
            await tokenRefreshService.refreshAllTokens();
        }
        catch (error) {
            logger_1.default.error(`Token refresh cron job failed: ${error.message}`);
        }
    });
    // Run PKCE cleanup every hour
    node_cron_1.default.schedule('0 * * * *', async () => {
        logger_1.default.debug('Running PKCE cleanup...');
        try {
            await pkce_service_1.pkceService.cleanup();
        }
        catch (error) {
            logger_1.default.error(`PKCE cleanup cron job failed: ${error.message}`);
        }
    });
    // Run Database Backup daily at 2:00 AM
    node_cron_1.default.schedule('0 2 * * *', async () => {
        logger_1.default.info('Running daily database backup...');
        try {
            await backup_service_1.backupService.backupDatabase();
        }
        catch (error) {
            logger_1.default.error(`Database backup cron job failed: ${error.message}`);
        }
    });
    // Run Media Backup weekly on Sunday at 3:00 AM
    node_cron_1.default.schedule('0 3 * * 0', async () => {
        logger_1.default.info('Running weekly media backup...');
        try {
            await backup_service_1.backupService.backupMedia();
        }
        catch (error) {
            logger_1.default.error(`Media backup cron job failed: ${error.message}`);
        }
    });
    // Run Backup Cleanup daily at 4:00 AM
    node_cron_1.default.schedule('0 4 * * *', async () => {
        logger_1.default.info('Running backup cleanup...');
        try {
            await backup_service_1.backupService.cleanupOldBackups();
        }
        catch (error) {
            logger_1.default.error(`Backup cleanup cron job failed: ${error.message}`);
        }
    });
    logger_1.default.info('Cron jobs initialized successfully');
}
