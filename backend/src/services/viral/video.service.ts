import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

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
     * Generate a snippet (mock implementation for now)
     * In production, this would call Remotion SSR or a render service
     */
    async generateSnippet(data: VideoCompositionData): Promise<{ url: string; jobId: string }> {
        try {
            logger.info('Generating snippet with data:', { chapterId: data.chapterId, template: data.templateId });

            // Simulate rendering delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Return a mock URL (in real app, this would be the S3/R2 URL of the rendered video)
            return {
                url: `https://storage.lifeline.app/snippets/${data.chapterId}_${Date.now()}.mp4`,
                jobId: `job_${Date.now()}`,
            };
        } catch (error) {
            logger.error('Error generating snippet:', error);
            throw error;
        }
    }
}

export const videoService = new VideoService();
