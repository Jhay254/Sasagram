import { Request, Response } from 'express';
import { FollowService } from '../services/follow.service';
import prisma from '../db/prisma';

/**
 * Follow a user
 */
export async function followUser(req: Request, res: Response) {
    try {
        const followerId = req.user?.id;
        const { userId } = req.params;

        if (!followerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await FollowService.followUser(followerId, userId);

        res.json({
            success: true,
            message: 'Successfully followed user',
        });
    } catch (error: any) {
        console.error('Error following user:', error);
        res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(req: Request, res: Response) {
    try {
        const followerId = req.user?.id;
        const { userId } = req.params;

        if (!followerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await FollowService.unfollowUser(followerId, userId);

        res.json({
            success: true,
            message: 'Successfully unfollowed user',
        });
    } catch (error: any) {
        console.error('Error unfollowing user:', error);
        res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Get user's followers
 */
export async function getFollowers(req: Request, res: Response) {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const followers = await FollowService.getFollowers(
            userId,
            Number(limit),
            Number(offset)
        );

        res.json({
            success: true,
            data: followers,
        });
    } catch (error: any) {
        console.error('Error getting followers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get users that a user is following
 */
export async function getFollowing(req: Request, res: Response) {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const following = await FollowService.getFollowing(
            userId,
            Number(limit),
            Number(offset)
        );

        res.json({
            success: true,
            data: following,
        });
    } catch (error: any) {
        console.error('Error getting following:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Check if current user is following another user
 */
export async function checkFollowing(req: Request, res: Response) {
    try {
        const followerId = req.user?.id;
        const { userId } = req.params;

        if (!followerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const isFollowing = await FollowService.isFollowing(followerId, userId);

        res.json({
            success: true,
            data: { isFollowing },
        });
    } catch (error: any) {
        console.error('Error checking following:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get public profile for a user
 */
export async function getPublicProfile(req: Request, res: Response) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user?.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                location: true,
                website: true,
                role: true,
                isVerified: true,
                followerCount: true,
                followingCount: true,
                memoryCompleteness: true,
                createdAt: true,
                biographies: {
                    where: { published: true },
                    select: {
                        id: true,
                        title: true,
                        coverImageUrl: true,
                        viewCount: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 6,
                },
            },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if current user is following this user
        let isFollowing = false;
        if (currentUserId) {
            isFollowing = await FollowService.isFollowing(currentUserId, userId);
        }

        res.json({
            success: true,
            data: {
                ...user,
                isFollowing,
            },
        });
    } catch (error: any) {
        console.error('Error getting public profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get profile analytics (for creator's own profile)
 */
export async function getProfileAnalytics(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const analytics = await FollowService.getProfileAnalytics(userId);

        res.json({
            success: true,
            data: analytics,
        });
    } catch (error: any) {
        console.error('Error getting profile analytics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get mutual followers
 */
export async function getMutualFollowers(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const mutualFollowers = await FollowService.getMutualFollowers(userId);

        res.json({
            success: true,
            data: mutualFollowers,
        });
    } catch (error: any) {
        console.error('Error getting mutual followers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
