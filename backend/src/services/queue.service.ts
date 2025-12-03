import Queue from 'bull';
import { MediaService } from './media.service';

const mediaService = new MediaService();

// Redis connection config
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Create queues
export const mediaQueue = new Queue('media-processing', { redis: redisConfig });
export const emailQueue = new Queue('email-processing', { redis: redisConfig });
export const videoQueue = new Queue('video-processing', { redis: redisConfig });

// Define job types
interface MediaDownloadJob {
    url: string;
    userId: string;
    provider: string;
    contentId?: string;
}

interface VideoGenerationJob {
    chapterId: string;
    title: string;
    images: string[];
    music?: string;
    templateId: 'cinematic' | 'fast-paced' | 'minimal';
    outputPath: string;
}

// Process Media Jobs
mediaQueue.process(async (job) => {
    const { url, userId, provider, contentId } = job.data as MediaDownloadJob;
    console.log(`Processing media job ${job.id}: ${url}`);

    try {
        const mediaId = await mediaService.downloadAndStore(url, userId, provider, contentId);
        return { success: true, mediaId };
    } catch (error: any) {
        console.error(`Job ${job.id} failed:`, error.message);
        throw error;
    }
});

// Process Email Jobs (Placeholder for now)
emailQueue.process(async (job) => {
    console.log(`Processing email job ${job.id}`);
    // Implement email fetching logic here
    return { success: true };
});

// Event listeners
mediaQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed! Result:`, result);
});

mediaQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error ${err.message}`);
});
