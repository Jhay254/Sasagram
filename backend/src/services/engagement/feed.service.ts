import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';
import { chapterService } from './chapter.service';

const prisma = new PrismaClient();

export class FeedService {
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
        // Find active chapter to link to
        const activeChapter = await chapterService.getActiveChapter(userId);

        const entry = await prisma.livingFeedEntry.create({
            data: {
                userId,
                content: data.content,
                mood: data.mood,
                location: data.location,
                mediaUrls: JSON.stringify(data.mediaUrls || []),
                isPublic: data.isPublic ?? true,
                chapterId: activeChapter?.id,
            },
        });

        logger.info(`Created feed entry for user ${userId}`, { entryId: entry.id });
        return entry;
    }

    /**
     * Get aggregated feed for a user (own posts + connections)
     */
    async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<any[]> {
        const skip = (page - 1) * limit;

        // Get user's connections
        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId },
                ],
            },
        });

        const connectionIds = connections.map(c =>
            c.userAId === userId ? c.userBId : c.userAId
        );

        // Include user's own ID
        const feedUserIds = [userId, ...connectionIds];

        const entries = await prisma.livingFeedEntry.findMany({
            where: {
                userId: { in: feedUserIds },
                OR: [
                    { isPublic: true },
                    { userId }, // Always show own private posts
                ],
            },
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true, // In real app, use avatarUrl
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

        // Parse mediaUrls JSON
        return entries.map(entry => ({
            ...entry,
            mediaUrls: JSON.parse(entry.mediaUrls),
        }));
    }

    /**
     * Get entries for a specific chapter
     */
    async getChapterFeed(chapterId: string): Promise<any[]> {
        const entries = await prisma.livingFeedEntry.findMany({
            where: { chapterId },
            orderBy: { timestamp: 'asc' }, // Chronological for chapters
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

export const feedService = new FeedService();
