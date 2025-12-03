"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const cron_1 = require("./jobs/cron");
const worker_manager_1 = require("./jobs/worker-manager");
const env_1 = require("./config/env");
const logger_1 = __importDefault(require("./utils/logger"));
dotenv_1.default.config();
// Validate environment variables on startup
try {
    (0, env_1.validateEnv)();
}
catch (error) {
    logger_1.default.error('Failed to start server: ' + error.message);
    process.exit(1);
}
const PORT = process.env.PORT || 3000;
const server = app_1.default.listen(PORT, () => {
    logger_1.default.info(`Server is running on port ${PORT}`);
    // Initialize cron jobs
    (0, cron_1.initializeCronJobs)();
    // Initialize background workers
    (0, worker_manager_1.startWorkers)();
});
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger_1.default.info('HTTP server closed');
    });
});
