"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoService = exports.VideoService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
class VideoService {
    /**
     * Extract highlights from a chapter to generate a video composition
     */
    async extractHighlights(chapterId) {
        try {
            const chapter = await prisma.livingChapter.findUnique({
                where: { id: chapterId },
                include: {
                    entries: {
                        where: {
                            mediaUrls: { not: null },
                        },
                        orderBy: {
                            createdAt: 'desc', // Most recent content
                        },
                        take: 10, // Top 10 moments
                    },
                },
            });
            if (!chapter) {
                throw new Error('Chapter not found');
            }
            // Extract media URLs
            const images = [];
            const videos = [];
            chapter.entries.forEach(entry => {
                if (entry.mediaUrls) {
                    try {
                        const urls = JSON.parse(entry.mediaUrls);
                        if (Array.isArray(urls)) {
                            urls.forEach(url => {
                                if (url.endsWith('.mp4') || url.endsWith('.mov')) {
                                    videos.push(url);
                                }
                                else {
                                    images.push(url);
                                }
                            });
                        }
                    }
                    catch (e) {
                        // Ignore parse errors
                    }
                }
            });
            // Fallback if no media found (use placeholders or empty)
            if (images.length === 0 && videos.length === 0) {
                logger_1.default.warn(`No media found for chapter ${chapterId}`);
            }
            return {
                chapterId: chapter.id,
                title: chapter.title,
                images,
                videos,
                durationInSeconds: 15, // Default duration
                templateId: 'cinematic', // Default template
            };
        }
        catch (error) {
            logger_1.default.error('Error extracting highlights:', error);
            throw error;
        }
    }
    /**
     * Generate a snippet using Remotion rendering
     * Returns a job ID for tracking progress
     */
    async generateSnippet(data) {
        try {
            const { videoQueue } = await Promise.resolve().then(() => __importStar(require('../queue.service')));
            logger_1.default.info('Dispatching video generation job', {
                chapterId: data.chapterId,
                template: data.templateId
            });
            // Generate output path
            const timestamp = Date.now();
            const filename = `${data.chapterId}_${timestamp}.mp4`;
            const outputPath = path_1.default.join(process.cwd(), 'uploads', 'snippets', filename);
            // Add job to queue
            const job = await videoQueue.add({
                chapterId: data.chapterId,
                title: data.title,
                images: data.images,
                music: data.music,
                templateId: data.templateId,
                outputPath,
            });
            logger_1.default.info(`Video generation job created: ${job.id}`);
            return {
                jobId: job.id.toString(),
                status: 'processing',
            };
        }
        catch (error) {
            logger_1.default.error('Error generating snippet:', error);
            throw error;
        }
    }
    /**
     * Get video generation job status
     */
    async getJobStatus(jobId) {
        try {
            const { videoQueue } = await Promise.resolve().then(() => __importStar(require('../queue.service')));
            const job = await videoQueue.getJob(jobId);
            if (!job) {
                return { status: 'not_found' };
            }
            const state = await job.getState();
            const progress = job.progress();
            if (state === 'completed') {
                const result = job.returnvalue;
                return {
                    status: 'completed',
                    url: result.outputPath,
                    progress: 100,
                };
            }
            if (state === 'failed') {
                return {
                    status: 'failed',
                    error: job.failedReason,
                };
            }
            return {
                status: state,
                progress: typeof progress === 'number' ? progress : undefined,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting job status:', error);
            throw error;
        }
    }
}
exports.VideoService = VideoService;
exports.videoService = new VideoService();
