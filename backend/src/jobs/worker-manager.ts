import { createBiographyWorker } from './workers/biography.worker';
import { createEmailWorker } from './workers/email.worker';
import { createVideoWorker } from './workers/video.worker';
import { logger } from '../utils/logger';

export const startWorkers = () => {
    logger.info('Starting background workers...');

    const biographyWorker = createBiographyWorker();
    const emailWorker = createEmailWorker();
    const videoWorker = createVideoWorker();

    logger.info('Background workers started');

    return {
        biographyWorker,
        emailWorker,
        videoWorker
    };
};
