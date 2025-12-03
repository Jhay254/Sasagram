import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class RewindService {
    /**
     * Get "On This Day" content for a user
     * Returns content from previous years on the same month/day
     */
    /**
     * Get content for a specific date across all years
     */
    async getMemoryComparison(userId: string, date: Date): Promise<any[]> {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const targetYear = date.getFullYear();

        try {
            const allContent = await prisma.content.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
            });

            const allMedia = await prisma.media.findMany({
                where: { userId },
                orderBy: { takenAt: 'desc' },
            });

            const allFeedEntries = await prisma.livingFeedEntry.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
            });

            const comparisonItems: any[] = [];

            const isSameDay = (d: Date) => {
                return d.getMonth() + 1 === month && d.getDate() === day;
            };

            // Filter Content
            for (const item of allContent) {
                if (isSameDay(item.timestamp)) {
                    comparisonItems.push({
                        type: 'content',
                        data: item,
                        date: item.timestamp,
                        year: item.timestamp.getFullYear(),
                    });
                }
            }

            // Filter Media
            for (const item of allMedia) {
                if (item.takenAt && isSameDay(item.takenAt)) {
                    comparisonItems.push({
                        type: 'media',
                        data: item,
                        date: item.takenAt,
                        year: item.takenAt.getFullYear(),
                    });
                }
            }

            // Filter Feed Entries
            for (const item of allFeedEntries) {
                if (isSameDay(item.timestamp)) {
                    comparisonItems.push({
                        type: 'feed',
                        data: {
                            ...item,
                            mediaUrls: JSON.parse(item.mediaUrls),
                        },
                        date: item.timestamp,
                        year: item.timestamp.getFullYear(),
                    });
                }
            }

            return comparisonItems.sort((a, b) => b.year - a.year);

        } catch (error) {
            logger.error('Error fetching memory comparison:', error);
            throw error;
        }
    }

    /**
     * Get "On This Day" content (wrapper for getMemoryComparison with today's date)
     */
    async getOnThisDay(userId: string, timezoneOffset: number = 0): Promise<any[]> {
        return this.getMemoryComparison(userId, new Date());
    }

    /**
     * Get main Rewind feed (mix of On This Day, Random, and Recent)
     */
    async getRewindFeed(userId: string, cursor?: string, limit: number = 10): Promise<any> {
        // 1. Get On This Day (high priority)
        const onThisDay = await this.getOnThisDay(userId);

        // 2. Get some random memories
        const randomMemories = [];
        for (let i = 0; i < 3; i++) {
            const mem = await this.getRandomMemory(userId);
            if (mem) randomMemories.push({
                type: 'memory',
                data: mem,
                date: mem.timestamp,
                year: mem.timestamp.getFullYear(),
            });
        }

        // 3. Get recent feed entries
        const recentFeed = await prisma.livingFeedEntry.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            take: 5,
        });

        const recentItems = recentFeed.map(item => ({
            type: 'feed',
            data: {
                ...item,
                mediaUrls: JSON.parse(item.mediaUrls),
            },
            date: item.timestamp,
            year: item.timestamp.getFullYear(),
        }));

        // Interleave content
        const feed = [
            ...onThisDay.slice(0, 3),
            ...randomMemories,
            ...recentItems,
            ...onThisDay.slice(3),
        ];

        return {
            items: feed,
            nextCursor: null, // Implement real cursor logic later
        };
    }

    /**
     * Get a random memory for the user
     */
    async getRandomMemory(userId: string): Promise<any> {
        const count = await prisma.content.count({ where: { userId } });
        if (count === 0) return null;

        const skip = Math.floor(Math.random() * count);
        const randomContent = await prisma.content.findFirst({
            where: { userId },
            skip,
        });

        return randomContent;
    }

    /**
     * Get timeline data for a specific year
     */
    async getTimeline(userId: string, year: number): Promise<any[]> {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const content = await prisma.content.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { timestamp: 'asc' },
        });

        return content;
    }

    /**
     * Get all memories with location data for the map
     */
    async getMemoryLocations(userId: string): Promise<any[]> {
        // Fetch content with location
        const content = await prisma.content.findMany({
            where: {
                userId,
                // Note: Content model doesn't have location field in schema
                // This is a placeholder for when location is added
            },
            select: {
                id: true,
                text: true,
                timestamp: true,
                contentType: true,
            },
        });

        // Fetch feed entries with location
        const feedEntries = await prisma.livingFeedEntry.findMany({
            where: {
                userId,
                location: { not: null },
            },
            select: {
                id: true,
                content: true,
                location: true,
                timestamp: true,
                mood: true,
            },
        });

        // Normalize data
        const locations = [
            ...feedEntries.map(f => ({
                id: f.id,
                type: 'feed',
                label: f.content.substring(0, 30) + (f.content.length > 30 ? '...' : ''),
                location: f.location,
                date: f.timestamp,
                mood: f.mood,
            })),
        ];

        return locations;
    }
}

export const rewindService = new RewindService();
