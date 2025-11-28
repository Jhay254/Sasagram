import prisma from '../db/prisma';
import { ChapterSchedule } from '@prisma/client';

export interface ReleasePattern {
    pattern: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
    dayOfWeek?: number; // 0-6 (0 = Sunday)
    timeOfDay?: string; // HH:MM format
    customCron?: string; // Cron expression
    timezone?: string;
}

export class ChapterSchedulingService {
    /**
     * Schedule a single chapter for future release
     */
    static async scheduleChapter(chapterId: string, releaseAt: Date): Promise<void> {
        await prisma.chapter.update({
            where: { id: chapterId },
            data: {
                scheduledReleaseAt: releaseAt,
                isReleased: false,
                releaseStatus: 'SCHEDULED',
            },
        });
    }

    /**
     * Create biography-wide release schedule (episodic pattern)
     */
    static async createBiographySchedule(
        biographyId: string,
        pattern: ReleasePattern
    ): Promise<ChapterSchedule> {
        const nextRelease = this.calculateNextRelease(pattern);

        return await prisma.chapterSchedule.upsert({
            where: { biographyId },
            update: {
                releasePattern: pattern.pattern,
                customCron: pattern.customCron,
                dayOfWeek: pattern.dayOfWeek,
                timeOfDay: pattern.timeOfDay,
                timezone: pattern.timezone || 'UTC',
                nextReleaseAt: nextRelease,
                isActive: true,
            },
            create: {
                biographyId,
                releasePattern: pattern.pattern,
                customCron: pattern.customCron,
                dayOfWeek: pattern.dayOfWeek,
                timeOfDay: pattern.timeOfDay,
                timezone: pattern.timezone || 'UTC',
                nextReleaseAt: nextRelease,
                isActive: true,
            },
        });
    }

    /**
     * Get biography schedule
     */
    static async getBiographySchedule(biographyId: string): Promise<ChapterSchedule | null> {
        return await prisma.chapterSchedule.findUnique({
            where: { biographyId },
        });
    }

    /**
     * Delete schedule for a chapter
     */
    static async cancelChapterSchedule(chapterId: string): Promise<void> {
        await prisma.chapter.update({
            where: { id: chapterId },
            data: {
                scheduledReleaseAt: null,
                releaseStatus: 'DRAFT',
            },
        });
    }

    /**
     * Delete biography-wide schedule
     */
    static async deleteBiographySchedule(biographyId: string): Promise<void> {
        await prisma.chapterSchedule.delete({
            where: { biographyId },
        });
    }

    /**
     * Get upcoming chapters for a biography
     */
    static async getUpcomingChapters(biographyId: string) {
        return await prisma.chapter.findMany({
            where: {
                biographyId,
                isReleased: false,
                scheduledReleaseAt: { not: null },
            },
            orderBy: { scheduledReleaseAt: 'asc' },
        });
    }

    /**
     * Release all scheduled chapters whose time has come
     * This should be called by a cron job
     */
    static async releaseScheduledChapters(): Promise<void> {
        const now = new Date();

        // Find all chapters scheduled for release
        const chaptersToRelease = await prisma.chapter.findMany({
            where: {
                isReleased: false,
                releaseStatus: 'SCHEDULED',
                scheduledReleaseAt: {
                    lte: now,
                },
            },
            include: {
                biography: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        console.log(`[Chapter Release Job] Found ${chaptersToRelease.length} chapters to release`);

        for (const chapter of chaptersToRelease) {
            try {
                // Mark chapter as released
                await prisma.chapter.update({
                    where: { id: chapter.id },
                    data: {
                        isReleased: true,
                        releaseStatus: 'RELEASED',
                    },
                });

                console.log(`[Chapter Release Job] Released chapter: ${chapter.title} (${chapter.id})`);

                // Send notifications to followers
                await this.notifyChapterRelease(chapter.id, chapter.biography.userId);

                // Update schedule's last release time
                const schedule = await prisma.chapterSchedule.findUnique({
                    where: { biographyId: chapter.biographyId },
                });

                if (schedule) {
                    const nextRelease = this.calculateNextRelease({
                        pattern: schedule.releasePattern as any,
                        dayOfWeek: schedule.dayOfWeek || undefined,
                        timeOfDay: schedule.timeOfDay || undefined,
                        customCron: schedule.customCron || undefined,
                        timezone: schedule.timezone,
                    });

                    await prisma.chapterSchedule.update({
                        where: { biographyId: chapter.biographyId },
                        data: {
                            lastReleaseAt: now,
                            nextReleaseAt: nextRelease,
                        },
                    });
                }
            } catch (error) {
                console.error(`[Chapter Release Job] Error releasing chapter ${chapter.id}:`, error);
            }
        }
    }

    /**
     * Notify followers about chapter release
     */
    private static async notifyChapterRelease(chapterId: string, creatorId: string): Promise<void> {
        // Import notification service to avoid circular dependency
        const { NotificationService } = await import('./notification.service');

        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                biography: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!chapter) return;

        // Get all followers of this creator
        const followers = await prisma.follow.findMany({
            where: { followingId: creatorId },
            select: { followerId: true },
        });

        const creatorName = chapter.biography.user.displayName || chapter.biography.user.email;

        // Send notification to each follower
        for (const follower of followers) {
            await NotificationService.sendNotification(
                follower.followerId,
                'CHAPTER_RELEASED' as any,
                `New chapter from ${creatorName}`,
                `"${chapter.title}" is now available to read!`,
                {
                    chapterId: chapter.id,
                    biographyId: chapter.biographyId,
                }
            );
        }
    }

    /**
     * Calculate next release date based on pattern
     */
    private static calculateNextRelease(pattern: ReleasePattern): Date {
        const now = new Date();
        const [hours, minutes] = (pattern.timeOfDay || '18:00').split(':').map(Number);

        switch (pattern.pattern) {
            case 'WEEKLY': {
                const targetDay = pattern.dayOfWeek || 5; // Default to Friday
                const daysUntilTarget = (targetDay - now.getDay() + 7) % 7 || 7;
                const nextDate = new Date(now);
                nextDate.setDate(now.getDate() + daysUntilTarget);
                nextDate.setHours(hours, minutes, 0, 0);
                return nextDate;
            }

            case 'BIWEEKLY': {
                const targetDay = pattern.dayOfWeek || 5;
                const daysUntilTarget = (targetDay - now.getDay() + 7) % 7 || 7;
                const nextDate = new Date(now);
                nextDate.setDate(now.getDate() + daysUntilTarget + 7); // Add extra week
                nextDate.setHours(hours, minutes, 0, 0);
                return nextDate;
            }

            case 'MONTHLY': {
                const nextDate = new Date(now);
                nextDate.setMonth(now.getMonth() + 1);
                nextDate.setHours(hours, minutes, 0, 0);
                return nextDate;
            }

            case 'CUSTOM': {
                // For custom cron patterns, default to 7 days
                const nextDate = new Date(now);
                nextDate.setDate(now.getDate() + 7);
                nextDate.setHours(hours, minutes, 0, 0);
                return nextDate;
            }

            default:
                throw new Error(`Unknown release pattern: ${pattern.pattern}`);
        }
    }

    /**
     * Check if a chapter is complete and ready for release
     */
    static async isChapterComplete(chapterId: string): Promise<boolean> {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
        });

        if (!chapter) return false;

        // Chapter is complete if:
        // 1. Has sufficient content (word count > 500)
        // 2. Has a title
        // 3. Has a summary
        return (
            chapter.wordCount > 500 &&
            chapter.title.length > 0 &&
            (chapter.summary?.length || 0) > 0
        );
    }

    /**
     * Get schedule info for a specific chapter
     */
    static async getChapterScheduleInfo(chapterId: string) {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            select: {
                scheduledReleaseAt: true,
                isReleased: true,
                releaseStatus: true,
            },
        });

        return chapter;
    }
}
