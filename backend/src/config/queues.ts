import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * BullMQ Queue Configuration
 * Manages background job processing for AI generation, media downloads, etc.
 */

// Redis connection for BullMQ
const connection = createRedisConnection();

/**
 * Queue Names
 */
export enum QueueName {
    BIOGRAPHY_GENERATION = 'biography-generation',
    MEDIA_DOWNLOAD = 'media-download',
    SENTIMENT_ANALYSIS = 'sentiment-analysis',
    EMAIL_NOTIFICATION = 'email-notification',
    DATA_SYNC = 'data-sync',
}

/**
 * Job Priorities
 */
export enum JobPriority {
    CRITICAL = 1,
    HIGH = 2,
    NORMAL = 3,
    LOW = 4,
}

/**
 * Create a new queue
 */
export const createQueue = (name: QueueName): Queue => {
    const queue = new Queue(name, {
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

    logger.info(`Queue created: ${name}`);
    return queue;
};

/**
 * Create queue events listener
 */
export const createQueueEvents = (name: QueueName): QueueEvents => {
    const queueEvents = new QueueEvents(name, { connection });

    queueEvents.on('completed', ({ jobId }) => {
        logger.info(`Job completed: ${jobId} in queue ${name}`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
        logger.error(`Job failed: ${jobId} in queue ${name}`, { failedReason });
    });

    queueEvents.on('progress', ({ jobId, data }) => {
        logger.debug(`Job progress: ${jobId} in queue ${name}`, { progress: data });
    });

    return queueEvents;
};

/**
 * Biography Generation Queue
 */
export const biographyQueue = createQueue(QueueName.BIOGRAPHY_GENERATION);
export const biographyQueueEvents = createQueueEvents(QueueName.BIOGRAPHY_GENERATION);

/**
 * Media Download Queue
 */
export const mediaDownloadQueue = createQueue(QueueName.MEDIA_DOWNLOAD);
export const mediaDownloadQueueEvents = createQueueEvents(QueueName.MEDIA_DOWNLOAD);

/**
 * Sentiment Analysis Queue
 */
export const sentimentQueue = createQueue(QueueName.SENTIMENT_ANALYSIS);
export const sentimentQueueEvents = createQueueEvents(QueueName.SENTIMENT_ANALYSIS);

/**
 * Email Notification Queue
 */
export const emailQueue = createQueue(QueueName.EMAIL_NOTIFICATION);
export const emailQueueEvents = createQueueEvents(QueueName.EMAIL_NOTIFICATION);

/**
 * Data Sync Queue
 */
export const dataSyncQueue = createQueue(QueueName.DATA_SYNC);
export const dataSyncQueueEvents = createQueueEvents(QueueName.DATA_SYNC);

/**
 * Helper function to add a job to a queue
 */
export const addJob = async <T = any>(
    queue: Queue,
    name: string,
    data: T,
    options?: {
        priority?: JobPriority;
        delay?: number;
        attempts?: number;
    }
): Promise<Job<T>> => {
    const job = await queue.add(name, data, {
        priority: options?.priority || JobPriority.NORMAL,
        delay: options?.delay || 0,
        attempts: options?.attempts || 3,
    });

    logger.info(`Job added: ${job.id} (${name}) to queue ${queue.name}`);
    return job;
};

/**
 * Get job status
 */
export const getJobStatus = async (queue: Queue, jobId: string) => {
    const job = await queue.getJob(jobId);
    if (!job) return null;

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

/**
 * Retry a failed job
 */
export const retryJob = async (queue: Queue, jobId: string): Promise<boolean> => {
    const job = await queue.getJob(jobId);
    if (!job) return false;

    await job.retry();
    logger.info(`Job retried: ${jobId}`);
    return true;
};

/**
 * Remove a job
 */
export const removeJob = async (queue: Queue, jobId: string): Promise<boolean> => {
    const job = await queue.getJob(jobId);
    if (!job) return false;

    await job.remove();
    logger.info(`Job removed: ${jobId}`);
    return true;
};

/**
 * Get queue metrics
 */
export const getQueueMetrics = async (queue: Queue) => {
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

/**
 * Pause a queue
 */
export const pauseQueue = async (queue: Queue): Promise<void> => {
    await queue.pause();
    logger.warn(`Queue paused: ${queue.name}`);
};

/**
 * Resume a queue
 */
export const resumeQueue = async (queue: Queue): Promise<void> => {
    await queue.resume();
    logger.info(`Queue resumed: ${queue.name}`);
};

/**
 * Clean old jobs from queue
 */
export const cleanQueue = async (
    queue: Queue,
    grace: number = 24 * 3600 * 1000, // 24 hours
    status: 'completed' | 'failed' = 'completed'
): Promise<string[]> => {
    const jobs = await queue.clean(grace, 1000, status);
    logger.info(`Cleaned ${jobs.length} ${status} jobs from queue ${queue.name}`);
    return jobs;
};

/**
 * Graceful shutdown - close all queues and workers
 */
export const shutdownQueues = async (): Promise<void> => {
    logger.info('Shutting down queues...');

    await Promise.all([
        biographyQueue.close(),
        mediaDownloadQueue.close(),
        sentimentQueue.close(),
        emailQueue.close(),
        dataSyncQueue.close(),
    ]);

    await connection.quit();
    logger.info('All queues shut down');
};

// Handle process termination
process.on('SIGTERM', shutdownQueues);
process.on('SIGINT', shutdownQueues);

export default {
    biographyQueue,
    mediaDownloadQueue,
    sentimentQueue,
    emailQueue,
    dataSyncQueue,
    addJob,
    getJobStatus,
    retryJob,
    removeJob,
    getQueueMetrics,
    pauseQueue,
    resumeQueue,
    cleanQueue,
};
