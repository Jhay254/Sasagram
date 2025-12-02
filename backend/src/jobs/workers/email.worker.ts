import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../../config/redis';
import { QueueName } from '../../config/queues';
import { logger } from '../../utils/logger';

export interface EmailJobData {
    to: string;
    subject: string;
    body: string;
}

export const createEmailWorker = () => {
    const worker = new Worker<EmailJobData>(
        QueueName.EMAIL_NOTIFICATION,
        async (job: Job) => {
            logger.info(`Sending email to ${job.data.to}`);
            // Simulate email sending
            await new Promise(resolve => setTimeout(resolve, 1000));
            logger.info(`Email sent to ${job.data.to}`);
            return { sent: true };
        },
        {
            connection: createRedisConnection(),
        }
    );

    worker.on('completed', (job) => {
        logger.info(`Email job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Email job ${job?.id} failed:`, err);
    });

    return worker;
};
