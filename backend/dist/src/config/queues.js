"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shutdownQueues = exports.cleanQueue = exports.resumeQueue = exports.pauseQueue = exports.getQueueMetrics = exports.removeJob = exports.retryJob = exports.getJobStatus = exports.addJob = exports.dataSyncQueueEvents = exports.dataSyncQueue = exports.emailQueueEvents = exports.emailQueue = exports.sentimentQueueEvents = exports.sentimentQueue = exports.mediaDownloadQueueEvents = exports.mediaDownloadQueue = exports.biographyQueueEvents = exports.biographyQueue = exports.createQueueEvents = exports.createQueue = exports.JobPriority = exports.QueueName = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
/**
 * BullMQ Queue Configuration
 * Manages background job processing for AI generation, media downloads, etc.
 */
// Redis connection for BullMQ
const connection = (0, redis_1.createRedisConnection)();
/**
 * Queue Names
 */
var QueueName;
(function (QueueName) {
    QueueName["BIOGRAPHY_GENERATION"] = "biography-generation";
    QueueName["MEDIA_DOWNLOAD"] = "media-download";
    QueueName["SENTIMENT_ANALYSIS"] = "sentiment-analysis";
    QueueName["EMAIL_NOTIFICATION"] = "email-notification";
    QueueName["DATA_SYNC"] = "data-sync";
})(QueueName || (exports.QueueName = QueueName = {}));
/**
 * Job Priorities
 */
var JobPriority;
(function (JobPriority) {
    JobPriority[JobPriority["CRITICAL"] = 1] = "CRITICAL";
    JobPriority[JobPriority["HIGH"] = 2] = "HIGH";
    JobPriority[JobPriority["NORMAL"] = 3] = "NORMAL";
    JobPriority[JobPriority["LOW"] = 4] = "LOW";
})(JobPriority || (exports.JobPriority = JobPriority = {}));
/**
 * Create a new queue
 */
const createQueue = (name) => {
    const queue = new bullmq_1.Queue(name, {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: {
                age: 24 * 3600, // Keep completed jobs for 24 hours
                count: 1000, // Keep max 1000 completed jobs
            },
            removeOnFail: {
                age: 7 * 24 * 3600, // Keep failed jobs for 7 days
            },
        },
    });
    logger_1.logger.info(`Queue created: ${name}`);
    return queue;
};
exports.createQueue = createQueue;
/**
 * Create queue events listener
 */
const createQueueEvents = (name) => {
    const queueEvents = new bullmq_1.QueueEvents(name, { connection });
    queueEvents.on('completed', ({ jobId }) => {
        logger_1.logger.info(`Job completed: ${jobId} in queue ${name}`);
    });
    queueEvents.on('failed', ({ jobId, failedReason }) => {
        logger_1.logger.error(`Job failed: ${jobId} in queue ${name}`, { failedReason });
    });
    queueEvents.on('progress', ({ jobId, data }) => {
        logger_1.logger.debug(`Job progress: ${jobId} in queue ${name}`, { progress: data });
    });
    return queueEvents;
};
exports.createQueueEvents = createQueueEvents;
/**
 * Biography Generation Queue
 */
exports.biographyQueue = (0, exports.createQueue)(QueueName.BIOGRAPHY_GENERATION);
exports.biographyQueueEvents = (0, exports.createQueueEvents)(QueueName.BIOGRAPHY_GENERATION);
/**
 * Media Download Queue
 */
exports.mediaDownloadQueue = (0, exports.createQueue)(QueueName.MEDIA_DOWNLOAD);
exports.mediaDownloadQueueEvents = (0, exports.createQueueEvents)(QueueName.MEDIA_DOWNLOAD);
/**
 * Sentiment Analysis Queue
 */
exports.sentimentQueue = (0, exports.createQueue)(QueueName.SENTIMENT_ANALYSIS);
exports.sentimentQueueEvents = (0, exports.createQueueEvents)(QueueName.SENTIMENT_ANALYSIS);
/**
 * Email Notification Queue
 */
exports.emailQueue = (0, exports.createQueue)(QueueName.EMAIL_NOTIFICATION);
exports.emailQueueEvents = (0, exports.createQueueEvents)(QueueName.EMAIL_NOTIFICATION);
/**
 * Data Sync Queue
 */
exports.dataSyncQueue = (0, exports.createQueue)(QueueName.DATA_SYNC);
exports.dataSyncQueueEvents = (0, exports.createQueueEvents)(QueueName.DATA_SYNC);
/**
 * Helper function to add a job to a queue
 */
const addJob = async (queue, name, data, options) => {
    const job = await queue.add(name, data, {
        priority: options?.priority || JobPriority.NORMAL,
        delay: options?.delay || 0,
        attempts: options?.attempts || 3,
    });
    logger_1.logger.info(`Job added: ${job.id} (${name}) to queue ${queue.name}`);
    return job;
};
exports.addJob = addJob;
/**
 * Get job status
 */
const getJobStatus = async (queue, jobId) => {
    const job = await queue.getJob(jobId);
    if (!job)
        return null;
    const state = await job.getState();
    const progress = job.progress;
    const failedReason = job.failedReason;
    return {
        id: job.id,
        name: job.name,
        data: job.data,
        state,
        progress,
        failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
    };
};
exports.getJobStatus = getJobStatus;
/**
 * Retry a failed job
 */
const retryJob = async (queue, jobId) => {
    const job = await queue.getJob(jobId);
    if (!job)
        return false;
    await job.retry();
    logger_1.logger.info(`Job retried: ${jobId}`);
    return true;
};
exports.retryJob = retryJob;
/**
 * Remove a job
 */
const removeJob = async (queue, jobId) => {
    const job = await queue.getJob(jobId);
    if (!job)
        return false;
    await job.remove();
    logger_1.logger.info(`Job removed: ${jobId}`);
    return true;
};
exports.removeJob = removeJob;
/**
 * Get queue metrics
 */
const getQueueMetrics = async (queue) => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
    ]);
    return {
        name: queue.name,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
    };
};
exports.getQueueMetrics = getQueueMetrics;
/**
 * Pause a queue
 */
const pauseQueue = async (queue) => {
    await queue.pause();
    logger_1.logger.warn(`Queue paused: ${queue.name}`);
};
exports.pauseQueue = pauseQueue;
/**
 * Resume a queue
 */
const resumeQueue = async (queue) => {
    await queue.resume();
    logger_1.logger.info(`Queue resumed: ${queue.name}`);
};
exports.resumeQueue = resumeQueue;
/**
 * Clean old jobs from queue
 */
const cleanQueue = async (queue, grace = 24 * 3600 * 1000, // 24 hours
status = 'completed') => {
    const jobs = await queue.clean(grace, 1000, status);
    logger_1.logger.info(`Cleaned ${jobs.length} ${status} jobs from queue ${queue.name}`);
    return jobs;
};
exports.cleanQueue = cleanQueue;
/**
 * Graceful shutdown - close all queues and workers
 */
const shutdownQueues = async () => {
    logger_1.logger.info('Shutting down queues...');
    await Promise.all([
        exports.biographyQueue.close(),
        exports.mediaDownloadQueue.close(),
        exports.sentimentQueue.close(),
        exports.emailQueue.close(),
        exports.dataSyncQueue.close(),
    ]);
    await connection.quit();
    logger_1.logger.info('All queues shut down');
};
exports.shutdownQueues = shutdownQueues;
// Handle process termination
process.on('SIGTERM', exports.shutdownQueues);
process.on('SIGINT', exports.shutdownQueues);
exports.default = {
    biographyQueue: exports.biographyQueue,
    mediaDownloadQueue: exports.mediaDownloadQueue,
    sentimentQueue: exports.sentimentQueue,
    emailQueue: exports.emailQueue,
    dataSyncQueue: exports.dataSyncQueue,
    addJob: exports.addJob,
    getJobStatus: exports.getJobStatus,
    retryJob: exports.retryJob,
    removeJob: exports.removeJob,
    getQueueMetrics: exports.getQueueMetrics,
    pauseQueue: exports.pauseQueue,
    resumeQueue: exports.resumeQueue,
    cleanQueue: exports.cleanQueue,
};
