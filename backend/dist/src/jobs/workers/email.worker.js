"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../config/redis");
const queues_1 = require("../../config/queues");
const logger_1 = require("../../utils/logger");
const createEmailWorker = () => {
    const worker = new bullmq_1.Worker(queues_1.QueueName.EMAIL_NOTIFICATION, async (job) => {
        logger_1.logger.info(`Sending email to ${job.data.to}`);
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        logger_1.logger.info(`Email sent to ${job.data.to}`);
        return { sent: true };
    }, {
        connection: (0, redis_1.createRedisConnection)(),
    });
    worker.on('completed', (job) => {
        logger_1.logger.info(`Email job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
        logger_1.logger.error(`Email job ${job?.id} failed:`, err);
    });
    return worker;
};
exports.createEmailWorker = createEmailWorker;
