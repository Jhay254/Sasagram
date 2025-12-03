"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBiographyWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../config/redis");
const queues_1 = require("../../config/queues");
const biography_generation_job_1 = require("../biography-generation.job");
const logger_1 = require("../../utils/logger");
const createBiographyWorker = () => {
    const worker = new bullmq_1.Worker(queues_1.QueueName.BIOGRAPHY_GENERATION, async (job) => {
        logger_1.logger.info(`Processing biography job ${job.id}`);
        return (0, biography_generation_job_1.processBiographyGeneration)(job.data, async (progress) => {
            await job.updateProgress(progress);
        });
    }, {
        connection: (0, redis_1.createRedisConnection)(),
        concurrency: 1, // Process one biography at a time per worker
    });
    worker.on('completed', (job) => {
        logger_1.logger.info(`Biography job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
        logger_1.logger.error(`Biography job ${job?.id} failed:`, err);
    });
    return worker;
};
exports.createBiographyWorker = createBiographyWorker;
