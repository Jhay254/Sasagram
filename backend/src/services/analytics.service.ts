import prisma from '../db/prisma';

export class AnalyticsService {
    /**
     * Get creator analytics snapshot
     */
    static async getCreatorSnapshot(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                followerCount: true,
                followingCount: true,
                verifiedTagCount: true,
            },
        });

        // Biography stats
        const biographies = await prisma.biography.findMany({
            where: { userId, published: true },
            select: {
                viewCount: true,
                likeCount: true,
                shareCount: true,
                reviewCount: true,
                averageRating: true,
            },
        });

        const totalViews = biographies.reduce((sum, b) => sum + b.viewCount, 0);
        const totalLikes = biographies.reduce((sum, b) => sum + b.likeCount, 0);
        const totalShares = biographies.reduce((sum, b) => sum + b.shareCount, 0);
        const totalReviews = biographies.reduce((sum, b) => sum + b.reviewCount, 0);
        const avgRating = biographies.length > 0
            ? biographies.reduce((sum, b) => sum + b.averageRating, 0) / biographies.length
            : 0;

        return {
            followers: user?.followerCount || 0,
            following: user?.followingCount || 0,
            biographies: biographies.length,
            totalViews,
            totalLikes,
            totalShares,
            totalReviews,
            averageRating: avgRating,
            verifiedTags: user?.verifiedTagCount || 0,
        };
    }

    /**
     * Get subscriber growth (30 days)
     */
    static async getSubscriberGrowth(userId: string, days: number = 30) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const follows = await prisma.follow.findMany({
            where: {
                followingId: userId,
                createdAt: { gte: startDate },
            },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
        });

        // Group by day
        const growthByDay: Record<string, number> = {};
        follows.forEach(follow => {
            const date = follow.createdAt.toISOString().split('T')[0];
            growthByDay[date] = (growthByDay[date] || 0) + 1;
        });

        // Fill in missing days
        const data = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            data.push({
                date: dateStr,
                followers: growthByDay[dateStr] || 0,
            });
        }

        return data;
    }

    /**
     * Get content performance
     */
    static async getContentPerformance(userId: string, limit: number = 10) {
        const biographies = await prisma.biography.findMany({
            where: { userId, published: true },
            select: {
                id: true,
                title: true,
                viewCount: true,
                likeCount: true,
                shareCount: true,
                reviewCount: true,
                averageRating: true,
                createdAt: true,
            },
            orderBy: { viewCount: 'desc' },
            take: limit,
        });

        return biographies.map(bio => ({
            ...bio,
            engagementRate: bio.viewCount > 0
                ? ((bio.likeCount + bio.shareCount) / bio.viewCount) * 100
                : 0,
        }));
    }

    /**
     * Get revenue analytics (placeholder - depends on monetization)
     */
    static async getRevenueAnalytics(userId: string, days: number = 30) {
        // TODO: Implement when payments are live
        // This would query subscriptions, tips, etc.

        return {
            totalRevenue: 0,
            monthlyRevenue: 0,
            subscriptionRevenue: 0,
            tipRevenue: 0,
            revenueByDay: [],
        };
    }

    /**
     * Get audience demographics
     */
    static async getAudienceDemographics(userId: string) {
        // Get followers
        const followers = await prisma.follow.findMany({
            where: { followingId: userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        createdAt: true,
                    },
                },
            },
        });

        // Top engaged users (most activity on creator's content)
        const activities = await prisma.userActivity.findMany({
            where: {
                activityType: { in: ['VIEW_BIOGRAPHY', 'LIKE_BIOGRAPHY', 'SHARE_BIOGRAPHY'] },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        // Count activities by user
        const userActivityCounts = new Map<string, { user: any; count: number }>();
        activities.forEach(activity => {
            const existing = userActivityCounts.get(activity.userId);
            if (existing) {
                existing.count++;
            } else {
                userActivityCounts.set(activity.userId, {
                    user: activity.user,
                    count: 1,
                });
            }
        });

        const topEngaged = Array.from(userActivityCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(({ user, count }) => ({ ...user, activityCount: count }));

        return {
            totalFollowers: followers.length,
            newFollowers30d: followers.filter(
                f => f.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length,
            topEngagedUsers: topEngaged,
        };
    }

    /**
     * Get engagement metrics over time
     */
    static async getEngagementMetrics(userId: string, days: number = 30) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Get all creator's biographies
        const biographies = await prisma.biography.findMany({
            where: { userId, published: true },
            select: { id: true },
        });

        const bioIds = biographies.map(b => b.id);

        // Get activities
        const activities = await prisma.userActivity.findMany({
            where: {
                targetId: { in: bioIds },
                activityType: { in: ['VIEW_BIOGRAPHY', 'LIKE_BIOGRAPHY', 'SHARE_BIOGRAPHY'] },
                createdAt: { gte: startDate },
            },
            select: {
                activityType: true,
                createdAt: true,
            },
        });

        // Group by day and type
        const metricsByDay: Record<string, { views: number; likes: number; shares: number }> = {};

        activities.forEach(activity => {
            const date = activity.createdAt.toISOString().split('T')[0];
            if (!metricsByDay[date]) {
                metricsByDay[date] = { views: 0, likes: 0, shares: 0 };
            }

            if (activity.activityType === 'VIEW_BIOGRAPHY') metricsByDay[date].views++;
            if (activity.activityType === 'LIKE_BIOGRAPHY') metricsByDay[date].likes++;
            if (activity.activityType === 'SHARE_BIOGRAPHY') metricsByDay[date].shares++;
        });

        // Fill in missing days
        const data = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            data.push({
                date: dateStr,
                views: metricsByDay[dateStr]?.views || 0,
                likes: metricsByDay[dateStr]?.likes || 0,
                shares: metricsByDay[dateStr]?.shares || 0,
            });
        }

        return data;
    }
}
