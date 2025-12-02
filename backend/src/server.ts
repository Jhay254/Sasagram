import app from './app';
import dotenv from 'dotenv';
import { initializeCronJobs } from './jobs/cron';
import { startWorkers } from './jobs/worker-manager';
import { validateEnv } from './config/env';
import Logger from './utils/logger';

dotenv.config();

// Validate environment variables on startup
try {
    validateEnv();
} catch (error: any) {
    Logger.error('Failed to start server: ' + error.message);
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    Logger.info(`Server is running on port ${PORT}`);

    // Initialize cron jobs
    initializeCronJobs();

    // Initialize background workers
    startWorkers();
});

process.on('SIGTERM', () => {
    Logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        Logger.info('HTTP server closed');
    });
});
