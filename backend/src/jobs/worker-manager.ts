import { createBiographyWorker } from './workers/biography.worker';
import { createEmailWorker } from './workers/email.worker';
import { logger } from '../utils/logger';

export const startWorkers = () => {
    logger.info('Starting background workers...');

    const biographyWorker = createBiographyWorker();
    const emailWorker = createEmailWorker();

    logger.info('Background workers started');

    return {
        biographyWorker,
        emailWorker
    };
};
