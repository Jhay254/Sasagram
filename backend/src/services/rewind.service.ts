import prisma from '../db/prisma';
import { subYears, format, startOfDay, endOfDay } from 'date-fns';

/**
 * Rewind Service - Instagram Stories-style memory interface
 * Query-on-demand approach (no pre-storage), 5-year history limit
 */
export class RewindService {
    private static readonly MAX_HISTORY_YEARS = 5;

    /**
     * Generate day snapshot on-demand (not pre-stored)
     */
    static async getDaySnapshot(userId: string, date: Date) {
        // Verify date is within 5-year limit
        const fiveYearsAgo = subYears(new Date(), this.MAX_HISTORY_YEARS);
        if (date < fiveYearsAgo) {
            throw new Error('Date is too far in the past (5-year limit)');
        }

        // Check if user has location tracking enabled (Phase 2.11 requirement)
        const hasLocation = await this.checkLocationTrackingEnabled(userId);
        if (!hasLocation) {
            throw new Error('Location tracking (Phase 2.11) must be enabled to use Rewind feature');
        }

        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        // Query all data for this day
        const [posts, events, photos, location, mood, diary] = await Promise.all([
            this.getPostsForDay(userId, dayStart, dayEnd),
            this.getEventsForDay(userId, dayStart, dayEnd),
            this.getPhotosForDay(userId, dayStart, dayEnd),
            this.getPrimaryLocationForDay(userId, dayStart, dayEnd),
            this.getMoodForDay(userId, dayStart, dayEnd),
            this.getDiaryEntryForDay(userId, dayStart, dayEnd),
        ]);

        return {
            date: format(date, 'yyyy-MM-dd'),
            dayOfWeek: format(date, 'EEEE'),
            location,
            posts,
            events,
            photos,
            mood,
            diary,
            hasContent: posts.length > 0 || events.length > 0 || photos.length > 0 || !!mood || !!diary,
        };
    }

    /**
     * Get swipeable timeline (7 days before and after target date)
     */
    static async getSwipeableTimeline(userId: string, targetDate: Date) {
        const snapshots = [];

        // Get 7 days before and 7 days after
        for (let i = -7; i <= 7; i++) {
            const date = new Date(targetDate);
            date.setDate(date.getDate() + i);

            try {
                const snapshot = await this.getDaySnapshot(userId, date);
                snapshots.push(snapshot);
            } catch (error) {
                // Skip days outside 5-year limit
                continue;
            }
        }

        return snapshots;
    }

    /**
     * Find "On This Day" memories (1, 2, 3, 5, 10 years ago)
     */
    static async findOnThisDayMemories(userId: string, forDate: Date = new Date()) {
        const memories = [];
        const yearsToCheck = [1, 2, 3, 5, 10];

        for (const years of yearsToCheck) {
            if (years > this.MAX_HISTORY_YEARS) continue; // Respect 5-year limit

            const targetDate = subYears(forDate, years);

            try {
                const snapshot = await this.getDaySnapshot(userId, targetDate);

                if (snapshot.hasContent) {
                    memories.push({
                        yearsAgo: years,
                        originalDate: targetDate,
                        snapshot,
                        title: `${years} year${years > 1 ? 's' : ''} ago`,
                        summary: this.generateMemorySummary(snapshot),
                    });
                }
            } catch (error) {
                // No data for this date, skip
                continue;
            }
        }

        return memories;
    }

    /**
     * Generate daily random memory
     */
    static async generateDailyRandomMemory(userId: string) {
        const fiveYearsAgo = subYears(new Date(), this.MAX_HISTORY_YEARS);

        // Get random date within last 5 years
        const randomDaysAgo = Math.floor(Math.random() * (this.MAX_HISTORY_YEARS * 365));
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - randomDaysAgo);

        if (randomDate < fiveYearsAgo) {
            return null; // Outside 5-year window
        }

        try {
            const snapshot = await this.getDaySnapshot(userId, randomDate);

            if (!snapshot.hasContent) {
                return null; // No content for this day
            }

            // Pick random element from snapshot
            const memory = this.pickRandomMemory(snapshot);

            // Save random memory
            const saved = await prisma.randomMemory.create({
                data: {
                    userId,
                    date: randomDate,
                    memoryType: memory.type,
                    sourceType: memory.sourceType,
                    sourceId: memory.sourceId,
                    title: memory.title,
                    description: memory.description,
                    thumbnailUrl: memory.thumbnailUrl,
                },
            });

            return saved;
        } catch (error) {
            return null;
        }
    }

    /**
     * Generate past vs. present comparison
     */
    static async generateComparison(userId: string, pastDate: Date, presentDate: Date = new Date()) {
        const [past, present] = await Promise.all([
            this.getDaySnapshot(userId, pastDate),
            this.getDaySnapshot(userId, presentDate),
        ]);

        return {
            past: {
                date: past.date,
                location: past.location,
                mood: past.mood,
                postCount: past.posts.length,
                photoCount: past.photos.length,
                eventCount: past.events.length,
            },
            present: {
                date: present.date,
                location: present.location,
                mood: present.mood,
                postCount: present.posts.length,
                photoCount: present.photos.length,
                eventCount: present.events.length,
            },
            comparison: {
                locationChanged: past.location?.city !== present.location?.city,
                moodDifference: this.calculateMoodDifference(past.mood, present.mood),
                activityChange: present.posts.length - past.posts.length,
                photoActivityChange: present.photos.length - past.photos.length,
            },
        };
    }

    /**
     * Helper: Get posts for a specific day
     */
    private static async getPostsForDay(userId: string, dayStart: Date, dayEnd: Date) {
        return await prisma.socialPost.findMany({
            where: {
                dataSource: { userId },
                timestamp: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            select: {
                id: true,
                platform: true,
                content: true,
                timestamp: true,
                url: true, // Link to source
            },
        });
    }

    /**
     * Helper: Get biography events for a specific day
     */
    private static async getEventsForDay(userId: string, dayStart: Date, dayEnd: Date) {
        return await prisma.biographyEvent.findMany({
            where: {
                biography: { userId },
                date: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
                category: true,
            },
        });
    }

    /**
     * Helper: Get photos for a specific day (links to sources)
     */
    private static async getPhotosForDay(userId: string, dayStart: Date, dayEnd: Date) {
        const mediaItems = await prisma.mediaItem.findMany({
            where: {
                biography: { userId },
                uploadedAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            select: {
                id: true,
                url: true, // Link to source (don't store copy)
                type: true,
                uploadedAt: true,
            },
        });

        return mediaItems;
    }

    /**
     * Helper: Get primary location for day (Phase 2.11)
     */
    private static async getPrimaryLocationForDay(userId: string, dayStart: Date, dayEnd: Date) {
        // Get location from Phase 2.11 location history if available
        // For now, return mock - real implementation would query location history
        return {
            city: 'San Francisco',
            country: 'USA',
            latitude: 37.7749,
            longitude: -122.4194,
        };
    }

    /**
     * Helper: Get mood for day (from diary entry)
     */
    private static async getMoodForDay(userId: string, dayStart: Date, dayEnd: Date) {
        // Query Phase 2.11 diary entries for mood
        // Mock for now
        return {
            mood: 'happy',
            score: 0.8,
        };
    }

    /**
     * Helper: Get diary entry for day
     */
    private static async getDiaryEntryForDay(userId: string, dayStart: Date, dayEnd: Date) {
        // Query Phase 2.11 diary entries
        // Mock for now
        return null;
    }

    /**
     * Helper: Check if user has location tracking enabled
     */
    private static async checkLocationTrackingEnabled(userId: string): Promise<boolean> {
        // Check Phase 2.11 location preferences
        // For now, assume enabled
        return true;
    }

    /**
     * Helper: Generate memory summary
     */
    private static generateMemorySummary(snapshot: any): string {
        const parts = [];

        if (snapshot.location) {
            parts.push(`in ${snapshot.location.city}`);
        }

        if (snapshot.posts.length > 0) {
            parts.push(`${snapshot.posts.length} post${snapshot.posts.length > 1 ? 's' : ''}`);
        }

        if (snapshot.photos.length > 0) {
            parts.push(`${snapshot.photos.length} photo${snapshot.photos.length > 1 ? 's' : ''}`);
        }

        if (snapshot.events.length > 0) {
            parts.push(`${snapshot.events.length} event${snapshot.events.length > 1 ? 's' : ''}`);
        }

        return parts.length > 0 ? parts.join(', ') : 'No activity';
    }

    /**
     * Helper: Pick random memory from snapshot
     */
    private static pickRandomMemory(snapshot: any) {
        const allItems = [
            ...snapshot.posts.map((p: any) => ({ type: 'POST', sourceType: p.platform, sourceId: p.id, title: 'Social post', description: p.content, thumbnail Url: null })),
            ...snapshot.photos.map((p: any) => ({ type: 'PHOTO', sourceType: 'MEDIA', sourceId: p.id, title: 'Photo memory', description: null, thumbnailUrl: p.url })),
            ...snapshot.events.map((e: any) => ({ type: 'EVENT', sourceType: 'BIOGRAPHY', sourceId: e.id, title: e.title, description: e.description, thumbnailUrl: null })),
        ];

        return allItems[Math.floor(Math.random() * allItems.length)];
    }

    /**
     * Helper: Calculate mood difference
     */
    private static calculateMoodDifference(pastMood: any, presentMood: any): number {
        if (!pastMood || !presentMood) return 0;
        return presentMood.score - pastMood.score;
    }

    /**
     * Get user's rewind preferences
     */
    static async getPreferences(userId: string) {
        let prefs = await prisma.rewindPreferences.findUnique({
            where: { userId },
        });

        if (!prefs) {
            prefs = await prisma.rewindPreferences.create({
                data: { userId },
            });
        }

        return prefs;
    }

    /**
     * Update rewind preferences
     */
    static async updatePreferences(userId: string, updates: any) {
        return await prisma.rewindPreferences.upsert({
            where: { userId },
            update: updates,
            create: { userId, ...updates },
        });
    }
}
