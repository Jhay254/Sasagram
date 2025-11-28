import prisma from '../db/prisma';

export class FollowService {
    /**
     * Follow a user
     */
    static async followUser(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) {
            throw new Error('Cannot follow yourself');
        }

        // Check if already following
        const existing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (existing) {
            throw new Error('Already following this user');
        }

        // Create follow relationship
        await prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        });

        // Update follower counts
        await Promise.all([
            prisma.user.update({
                where: { id: followerId },
                data: { followingCount: { increment: 1 } },
            }),
            prisma.user.update({
                where: { id: followingId },
                data: { followerCount: { increment: 1 } },
            }),
        ]);
    }

    /**
     * Unfollow a user
     */
    static async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const follow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (!follow) {
            throw new Error('Not following this user');
        }

        // Delete follow relationship
        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        // Update follower counts
        await Promise.all([
            prisma.user.update({
                where: { id: followerId },
                data: { followingCount: { decrement: 1 } },
            }),
            prisma.user.update({
                where: { id: followingId },
                data: { followerCount: { decrement: 1 } },
            }),
        ]);
    }

    /**
     * Get user's followers
     */
    static async getFollowers(userId: string, limit: number = 50, offset: number = 0) {
        const followers = await prisma.follow.findMany({
            where: { followingId: userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                        role: true,
                        isVerified: true,
                        followerCount: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        return followers.map(f => f.follower);
    }

    /**
     * Get users that a user is following
     */
    static async getFollowing(userId: string, limit: number = 50, offset: number = 0) {
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                        role: true,
                        isVerified: true,
                        followerCount: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        return following.map(f => f.following);
    }

    /**
     * Check if user A is following user B
     */
    static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        return !!follow;
    }

    /**
     * Get follow statistics for a user
     */
    static async getFollowStats(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                followerCount: true,
                followingCount: true,
            },
        });

        return {
            followers: user?.followerCount || 0,
            following: user?.followingCount || 0,
        };
    }

    /**
     * Get mutual followers (users who follow each other)
     */
    static async getMutualFollowers(userId: string) {
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });

        const followingIds = following.map(f => f.followingId);

        const mutualFollowers = await prisma.follow.findMany({
            where: {
                followerId: { in: followingIds },
                followingId: userId,
            },
            include: {
                follower: {
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

        return mutualFollowers.map(f => f.follower);
    }

    /**
     * Get profile analytics for creator
     */
    static async getProfileAnalytics(userId: string) {
        const [user, recentFollowers, topBiographies] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    followerCount: true,
                    followingCount: true,
                    biographies: {
                        select: {
                            viewCount: true,
                            likeCount: true,
                        },
                    },
                },
            }),
            // Followers gained in last 30 days
            prisma.follow.count({
                where: {
                    followingId: userId,
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
            // Top performing biographies
            prisma.biography.findMany({
                where: { userId },
                orderBy: { viewCount: 'desc' },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    viewCount: true,
                    likeCount: true,
                },
            }),
        ]);

        const totalViews = user?.biographies.reduce((sum, b) => sum + (b.viewCount || 0), 0) || 0;
        const totalLikes = user?.biographies.reduce((sum, b) => sum + (b.likeCount || 0), 0) || 0;

        return {
            followers: user?.followerCount || 0,
            following: user?.followingCount || 0,
            followersGainedLast30Days: recentFollowers,
            totalViews,
            totalLikes,
            topBiographies,
        };
    }
}
