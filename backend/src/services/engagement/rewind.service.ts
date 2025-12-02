import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class RewindService {
    /**
     * Get "On This Day" content for a user
     * Returns content from previous years on the same month/day
     */
    async getOnThisDay(userId: string, timezoneOffset: number = 0): Promise<any[]> {
        const today = new Date();
        const month = today.getMonth() + 1; // 1-12
        const day = today.getDate();

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

            const onThisDayItems: any[] = [];

            const isSameDay = (date: Date) => {
                return date.getMonth() + 1 === month && date.getDate() === day && date.getFullYear() !== today.getFullYear();
            };

            // Filter Content
            for (const item of allContent) {
                if (isSameDay(item.timestamp)) {
                    onThisDayItems.push({
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
                    onThisDayItems.push({
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
                    onThisDayItems.push({
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

            return onThisDayItems.sort((a, b) => b.year - a.year);

        } catch (error) {
            logger.error('Error fetching On This Day content:', error);
            throw error;
        }
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
