"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.biographyWorker = void 0;
const bullmq_1 = require("bullmq");
const biography_generation_job_1 = require("../jobs/biography-generation.job");
const logger_1 = require("../utils/logger");
const REDIS_CONNECTION = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
};
/**
 * Biography generation worker
 */
exports.biographyWorker = new bullmq_1.Worker('biography-generation', async (job) => {
    logger_1.logger.info(`Processing biography generation job ${job.id}`);
    const updateProgress = async (progress) => {
        await job.updateProgress(progress);
        logger_1.logger.info(`Job ${job.id} progress: ${progress}%`);
    };
    try {
        const result = await (0, biography_generation_job_1.processBiographyGeneration)(job.data, updateProgress);
        logger_1.logger.info(`Job ${job.id} completed successfully`);
        return result;
    }
    catch (error) {
        logger_1.logger.error(`Job ${job.id} failed:`, error);
        throw error;
    }
}, {
    connection: REDIS_CONNECTION,
    concurrency: 2, // Process 2 biographies at a time
    limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // per minute
    },
});
// Event handlers
exports.biographyWorker.on('completed', (job) => {
    logger_1.logger.info(`Biography generation job ${job.id} completed`);
});
exports.biographyWorker.on('failed', (job, err) => {
    logger_1.logger.error(`Biography generation job ${job?.id} failed:`, err);
});
exports.biographyWorker.on('error', (err) => {
    logger_1.logger.error('Biography worker error:', err);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, closing biography worker...');
    await exports.biographyWorker.close();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, closing biography worker...');
    await exports.biographyWorker.close();
    process.exit(0);
});
logger_1.logger.info('Biography worker started');
