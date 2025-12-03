"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoQueue = exports.emailQueue = exports.mediaQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const media_service_1 = require("./media.service");
const mediaService = new media_service_1.MediaService();
// Redis connection config
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};
// Create queues
exports.mediaQueue = new bull_1.default('media-processing', { redis: redisConfig });
exports.emailQueue = new bull_1.default('email-processing', { redis: redisConfig });
exports.videoQueue = new bull_1.default('video-processing', { redis: redisConfig });
// Process Media Jobs
exports.mediaQueue.process(async (job) => {
    const { url, userId, provider, contentId } = job.data;
    console.log(`Processing media job ${job.id}: ${url}`);
    try {
        const mediaId = await mediaService.downloadAndStore(url, userId, provider, contentId);
        return { success: true, mediaId };
    }
    catch (error) {
        console.error(`Job ${job.id} failed:`, error.message);
        throw error;
    }
});
// Process Email Jobs (Placeholder for now)
exports.emailQueue.process(async (job) => {
    console.log(`Processing email job ${job.id}`);
    // Implement email fetching logic here
    return { success: true };
});
// Event listeners
exports.mediaQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed! Result:`, result);
});
exports.mediaQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error ${err.message}`);
});
