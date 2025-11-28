import prisma from '../db/prisma';

export enum ActivityType {
    VIEW_BIOGRAPHY = 'VIEW_BIOGRAPHY',
    LIKE_BIOGRAPHY = 'LIKE_BIOGRAPHY',
    SHARE_BIOGRAPHY = 'SHARE_BIOGRAPHY',
    FOLLOW_USER = 'FOLLOW_USER',
    VIEW_PROFILE = 'VIEW_PROFILE',
    SEARCH = 'SEARCH',
}

export class UserActivityService {
    /**
     * Track user activity
     */
    static async trackActivity(
        userId: string,
        activityType: ActivityType,
        targetId?: string,
        metadata?: any
    ): Promise<void> {
        try {
            await prisma.userActivity.create({
                data: {
                    userId,
                    activityType,
                    targetId,
                    metadata,
                },
            });

            // Update biography view count if viewing
            if (activityType === ActivityType.VIEW_BIOGRAPHY && targetId) {
                await prisma.biography.update({
                    where: { id: targetId },
                    data: { viewCount: { increment: 1 } },
                });
            }

            // Update biography like count if liking
            if (activityType === ActivityType.LIKE_BIOGRAPHY && targetId) {
                await prisma.biography.update({
                    where: { id: targetId },
                    data: { likeCount: { increment: 1 } },
                });
            }
        } catch (error) {
            console.error('Error tracking activity:', error);
            // Don't throw - activity tracking shouldn't break the app
        }
    }

    /**
     * Get user's activity history
     */
    static async getUserActivity(userId: string, limit: number = 50) {
        return await prisma.userActivity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                    },
                },
            },
        });
    }

    /**
     * Get user's interests based on activity
     */
    static async getUserInterests(userId: string): Promise<string[]> {
        const activities = await prisma.userActivity.findMany({
            where: {
                userId,
                activityType: { in: ['VIEW_BIOGRAPHY', 'LIKE_BIOGRAPHY'] },
            },
            take: 100,
            orderBy: { createdAt: 'desc' },
        });

        const targetIds = activities
            .map(a => a.targetId)
            .filter(Boolean) as string[];

        if (targetIds.length === 0) return [];

        // Get biographies user has interacted with
        const biographies = await prisma.biography.findMany({
            where: { id: { in: targetIds } },
            select: { genre: true, tags: true },
        });

        // Extract genres and tags
        const interests = new Set<string>();
        biographies.forEach(bio => {
            if (bio.genre) interests.add(bio.genre);
            bio.tags?.forEach((tag: string) => interests.add(tag));
        });

        return Array.from(interests);
    }

    /**
     * Get popular biographies (most views/likes in last 7 days)
     */
    static async getPopularBiographies(limit: number = 10) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        return await prisma.biography.findMany({
            where: {
                published: true,
                createdAt: { gte: sevenDaysAgo },
            },
            orderBy: [
                { viewCount: 'desc' },
                { likeCount: 'desc' },
            ],
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                        isVerified: true,
                    },
                },
            },
        });
    }
}
