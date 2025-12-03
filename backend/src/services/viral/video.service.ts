import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';
import path from 'path';

const prisma = new PrismaClient();

export interface VideoCompositionData {
    chapterId: string;
    title: string;
    images: string[];
    videos: string[];
    music?: string;
    durationInSeconds: number;
    templateId: 'cinematic' | 'fast-paced' | 'minimal';
}

export class VideoService {
    /**
     * Extract highlights from a chapter to generate a video composition
     */
    async extractHighlights(chapterId: string): Promise<VideoCompositionData> {
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
            const images: string[] = [];
            const videos: string[] = [];

            chapter.entries.forEach(entry => {
                if (entry.mediaUrls) {
                    try {
                        const urls = JSON.parse(entry.mediaUrls);
                        if (Array.isArray(urls)) {
                            urls.forEach(url => {
                                if (url.endsWith('.mp4') || url.endsWith('.mov')) {
                                    videos.push(url);
                                } else {
                                    images.push(url);
                                }
                            });
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            });

            // Fallback if no media found (use placeholders or empty)
            if (images.length === 0 && videos.length === 0) {
                logger.warn(`No media found for chapter ${chapterId}`);
            }

            return {
                chapterId: chapter.id,
                title: chapter.title,
                images,
                videos,
                durationInSeconds: 15, // Default duration
                templateId: 'cinematic', // Default template
            };
        } catch (error) {
            logger.error('Error extracting highlights:', error);
            throw error;
        }
    }

    /**
     * Generate a snippet using Remotion rendering
     * Returns a job ID for tracking progress
     */
    async generateSnippet(data: VideoCompositionData): Promise<{ jobId: string; status: string }> {
        try {
            const { videoQueue } = await import('../queue.service');

            logger.info('Dispatching video generation job', {
                chapterId: data.chapterId,
                template: data.templateId
            });

            // Generate output path
            const timestamp = Date.now();
            const filename = `${data.chapterId}_${timestamp}.mp4`;
            const outputPath = path.join(process.cwd(), 'uploads', 'snippets', filename);

            // Add job to queue
            const job = await videoQueue.add({
                chapterId: data.chapterId,
                title: data.title,
                images: data.images,
                music: data.music,
                templateId: data.templateId,
                outputPath,
            });

            logger.info(`Video generation job created: ${job.id}`);

            return {
                jobId: job.id.toString(),
                status: 'processing',
            };
        } catch (error) {
            logger.error('Error generating snippet:', error);
            throw error;
        }
    }

    /**
     * Get video generation job status
     */
    async getJobStatus(jobId: string): Promise<{
        status: string;
        progress?: number;
        url?: string;
        error?: string;
    }> {
        try {
            const { videoQueue } = await import('../queue.service');
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
        } catch (error) {
            logger.error('Error getting job status:', error);
            throw error;
        }
    }
}

export const videoService = new VideoService();
