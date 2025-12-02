import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../../config/redis';
import { QueueName } from '../../config/queues';
import { processBiographyGeneration, BiographyGenerationJobData } from '../biography-generation.job';
import { logger } from '../../utils/logger';

export const createBiographyWorker = () => {
    const worker = new Worker<BiographyGenerationJobData>(
        QueueName.BIOGRAPHY_GENERATION,
        async (job: Job) => {
            logger.info(`Processing biography job ${job.id}`);
            return processBiographyGeneration(job.data, async (progress) => {
                await job.updateProgress(progress);
            });
        },
        {
            connection: createRedisConnection(),
            concurrency: 1, // Process one biography at a time per worker
        }
    );

    worker.on('completed', (job) => {
        logger.info(`Biography job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Biography job ${job?.id} failed:`, err);
    });

    return worker;
};
