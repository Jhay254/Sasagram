import { Job } from 'bull';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';
import logger from '../../utils/logger';
import { videoQueue } from '../../services/queue.service';

interface VideoJobData {
    chapterId: string;
    title: string;
    images: string[];
    music?: string;
    templateId: 'cinematic' | 'fast-paced' | 'minimal';
    outputPath: string;
}

export const createVideoWorker = () => {
    logger.info('Starting video processing worker...');

    videoQueue.process(async (job: Job<VideoJobData>) => {
        const { chapterId, title, images, music, templateId, outputPath } = job.data;

        logger.info(`Processing video job ${job.id} for chapter ${chapterId}`);

        try {
            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            await fs.mkdir(outputDir, { recursive: true });

            // Step 1: Bundle the Remotion project
            logger.info('Bundling Remotion project...');
            const bundleLocation = await bundle({
                entryPoint: path.join(__dirname, '..', '..', 'remotion', 'index.tsx'),
                webpackOverride: (config) => config,
            });

            logger.info(`Bundle created at: ${bundleLocation}`);

            // Step 2: Select the composition
            const compositionId = templateId === 'cinematic' ? 'Cinematic' : 'Cinematic';

            const composition = await selectComposition({
                serveUrl: bundleLocation,
                id: compositionId,
                inputProps: {
                    title,
                    images,
                    music,
                },
            });

            logger.info(`Selected composition: ${compositionId}`);

            // Step 3: Render the video
            logger.info('Rendering video...');
            await renderMedia({
                composition,
                serveUrl: bundleLocation,
                codec: 'h264',
                outputLocation: outputPath,
                onProgress: ({ progress }) => {
                    job.progress(Math.round(progress * 100));
                },
            });

            logger.info(`Video rendered successfully: ${outputPath}`);

            return {
                success: true,
                outputPath,
                chapterId,
            };
        } catch (error: any) {
            logger.error(`Video job ${job.id} failed:`, error);
            throw error;
        }
    });

    // Event listeners
    videoQueue.on('completed', (job, result) => {
        logger.info(`Video job ${job.id} completed!`, result);
    });

    videoQueue.on('failed', (job, err) => {
        logger.error(`Video job ${job.id} failed:`, err.message);
    });

    videoQueue.on('progress', (job, progress) => {
        logger.info(`Video job ${job.id} progress: ${progress}%`);
    });

    return videoQueue;
};
