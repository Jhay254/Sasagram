import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class LivingFeedService {
    /**
     * Create a new feed entry
     */
    async createEntry(userId: string, data: {
        content: string;
        mood?: string;
        location?: string;
        mediaUrls?: string[];
        isPublic?: boolean;
    }): Promise<any> {
        // Find active chapter
        const activeChapter = await prisma.livingChapter.findFirst({
            where: {
                userId,
                status: 'active',
            },
        });

        if (!activeChapter) {
            throw new Error('No active chapter found. Please start a new chapter first.');
        }

        const entry = await prisma.livingFeedEntry.create({
            data: {
                userId,
                chapterId: activeChapter.id,
                content: data.content,
                mood: data.mood,
                location: data.location,
                mediaUrls: JSON.stringify(data.mediaUrls || []),
                isPublic: data.isPublic ?? true,
            },
        });

        logger.info(`Created feed entry for user ${userId}`, { entryId: entry.id });
        return {
            ...entry,
            mediaUrls: JSON.parse(entry.mediaUrls),
        };
    }

    /**
     * Get aggregated feed for a user
     */
    async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<any> {
        const skip = (page - 1) * limit;

        // Get entries from user's own chapters and potentially followed users (future)
        // For now, just return user's own entries
        const entries = await prisma.livingFeedEntry.findMany({
            where: {
                userId,
            },
            orderBy: {
                timestamp: 'desc',
            },
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                chapter: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        const total = await prisma.livingFeedEntry.count({
            where: { userId },
        });

        const parsedEntries = entries.map(entry => ({
            ...entry,
            mediaUrls: JSON.parse(entry.mediaUrls),
        }));

        return {
            entries: parsedEntries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get entries for a specific chapter
     */
    async getChapterFeed(chapterId: string): Promise<any[]> {
        const entries = await prisma.livingFeedEntry.findMany({
            where: {
                chapterId,
            },
            orderBy: {
                timestamp: 'asc', // Chronological order for chapter view
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return entries.map(entry => ({
            ...entry,
            mediaUrls: JSON.parse(entry.mediaUrls),
        }));
    }
}

export const livingFeedService = new LivingFeedService();
