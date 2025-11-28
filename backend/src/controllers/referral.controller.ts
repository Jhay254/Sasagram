import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { ReferralService } from '../services/referral.service';

/**
 * Get or create referral code for current user
 */
export async function getMyReferralCode(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        let referralCode = await prisma.referralCode.findUnique({
            where: { userId },
        });

        if (!referralCode) {
            referralCode = await ReferralService.createReferralCode(userId);
        }

        res.json({
            success: true,
            data: referralCode,
        });
    } catch (error: any) {
        console.error('Error getting referral code:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get user's referral statistics
 */
export async function getReferralStats(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const stats = await ReferralService.getReferralStats(userId);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        console.error('Error getting referral stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get user's referral history
 */
export async function getReferralHistory(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { limit = 50, offset = 0 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const referrals = await prisma.referral.findMany({
            where: { referrerId: userId },
            include: {
                referred: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset),
        });

        res.json({
            success: true,
            data: referrals,
        });
    } catch (error: any) {
        console.error('Error getting referral history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get user's referral rewards
 */
export async function getReferralRewards(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const rewards = await prisma.referralReward.findMany({
            where: { userId },
            orderBy: { earnedAt: 'desc' },
        });

        res.json({
            success: true,
            data: rewards,
        });
    } catch (error: any) {
        console.error('Error getting referral rewards:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get user's referral milestones
 */
export async function getReferralMilestones(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const milestones = await ReferralService.getMilestones(userId);

        res.json({
            success: true,
            data: milestones,
        });
    } catch (error: any) {
        console.error('Error getting referral milestones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Send referral invitation email
 */
export async function sendReferralInvitation(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { email, name } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await ReferralService.sendInvitationEmail(userId, email, name);

        res.json({
            success: true,
            message: 'Invitation sent successfully',
        });
    } catch (error: any) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get leaderboard of top referrers
 */
export async function getReferralLeaderboard(req: Request, res: Response) {
    try {
        const { limit = 100 } = req.query;

        const topReferrers = await prisma.user.findMany({
            where: {
                successfulReferrals: { gt: 0 },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
                totalReferrals: true,
                successfulReferrals: true,
                referralEarnings: true,
            },
            orderBy: { successfulReferrals: 'desc' },
            take: Number(limit),
        });

        res.json({
            success: true,
            data: topReferrers,
        });
    } catch (error: any) {
        console.error('Error getting referral leaderboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
