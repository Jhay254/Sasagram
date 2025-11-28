import prisma from '../db/prisma';
import { UserActivityService } from './user-activity.service';

export class DiscoveryService {
    /**
     * Get personalized feed for user
     */
    static async getPersonalizedFeed(userId: string, limit: number = 20, offset: number = 0) {
        // Get user's interests
        const interests = await UserActivityService.getUserInterests(userId);

        // Get users the current user follows
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map(f => f.followingId);

        // Build personalized query
        const whereClause: any = {
            published: true,
            userId: { not: userId }, // Don't show own biographies
        };

        // If user has interests, prioritize those
        if (interests.length > 0) {
            whereClause.OR = [
                { genre: { in: interests } },
                { tags: { hasSome: interests } },
                { userId: { in: followingIds } }, // From followed users
            ];
        } else if (followingIds.length > 0) {
            // New user - show content from followed users
            whereClause.userId = { in: followingIds };
        }

        const biographies = await prisma.biography.findMany({
            where: whereClause,
            orderBy: [
                { viewCount: 'desc' },
                { createdAt: 'desc' },
            ],
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                        isVerified: true,
                        followerCount: true,
                    },
                },
            },
        });

        return biographies;
    }

    /**
     * Get trending biographies
     */
    static async getTrendingBiographies(limit: number = 10) {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get biographies with most activity in last 24 hours
        const recentActivities = await prisma.userActivity.groupBy({
            by: ['targetId'],
            where: {
                activityType: { in: ['VIEW_BIOGRAPHY', 'LIKE_BIOGRAPHY', 'SHARE_BIOGRAPHY'] },
                targetId: { not: null },
                createdAt: { gte: last24Hours },
            },
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: limit,
        });

        const trendingIds = recentActivities
            .map(a => a.targetId)
            .filter(Boolean) as string[];

        if (trendingIds.length === 0) {
            // Fallback to most viewed
            return await UserActivityService.getPopularBiographies(limit);
        }

        const biographies = await prisma.biography.findMany({
            where: { id: { in: trendingIds } },
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

        // Sort by trending order
        const bioMap = new Map(biographies.map(b => [b.id, b]));
        return trendingIds.map(id => bioMap.get(id)).filter(Boolean);
    }

    /**
     * Get biographies by category/genre
     */
    static async getBiographiesByCategory(
        category: string,
        limit: number = 20,
        offset: number = 0
    ) {
        return await prisma.biography.findMany({
            where: {
                published: true,
                genre: category,
            },
            orderBy: [
                { viewCount: 'desc' },
                { createdAt: 'desc' },
            ],
            take: limit,
            skip: offset,
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

    /**
     * Get featured creators (verified + high engagement)
     */
    static async getFeaturedCreators(limit: number = 10) {
        const creators = await prisma.user.findMany({
            where: {
                role: 'CREATOR',
                isVerified: true,
                followerCount: { gt: 100 },
            },
            orderBy: [
                { followerCount: 'desc' },
                { verifiedTagCount: 'desc' },
            ],
            take: limit,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                isVerified: true,
                followerCount: true,
                biographies: {
                    where: { published: true },
                    select: {
                        id: true,
                        title: true,
                        coverImageUrl: true,
                        viewCount: true,
                    },
                    orderBy: { viewCount: 'desc' },
                    take: 3,
                },
            },
        });

        return creators;
    }

    /**
     * Search biographies
     */
    static async searchBiographies(
        query: string,
        limit: number = 20,
        offset: number = 0
    ) {
        return await prisma.biography.findMany({
            where: {
                published: true,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { tags: { hasSome: [query.toLowerCase()] } },
                ],
            },
            orderBy: [
                { viewCount: 'desc' },
                { createdAt: 'desc' },
            ],
            take: limit,
            skip: offset,
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

    /**
     * Get available categories
     */
    static async getCategories() {
        const genres = await prisma.biography.groupBy({
            by: ['genre'],
            where: {
                published: true,
                genre: { not: null },
            },
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });

        return genres.map(g => ({
            name: g.genre,
            count: g._count.id,
        }));
    }
}
