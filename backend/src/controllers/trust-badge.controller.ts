import { Request, Response } from 'express';
import { TrustBadgeService } from '../services/trust-badge.service';

const trustBadgeService = new TrustBadgeService();

/**
 * Get user's trust badges
 * GET /api/trust-badges/:userId
 */
export const getUserBadges = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const badges = await trustBadgeService.getUserBadges(userId);

        res.json({ count: badges.length, badges });
    } catch (error: any) {
        console.error('Error getting user badges:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get badge earning criteria
 * GET /api/trust-badges/criteria
 */
export const getBadgeCriteria = async (req: Request, res: Response) => {
    try {
        const criteria = trustBadgeService.getBadgeCriteria();

        res.json(criteria);
    } catch (error: any) {
        console.error('Error getting badge criteria:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get user's progress to next badge
 * GET /api/trust-badges/progress
 */
export const getBadgeProgress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const progress = await trustBadgeService.getBadgeProgress(userId);

        res.json(progress);
    } catch (error: any) {
        console.error('Error getting badge progress:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Calculate and award badges for user
 * POST /api/trust-badges/calculate
 */
export const calculateBadges = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const newBadges = await trustBadgeService.calculateAndAwardBadges(userId);

        res.json({
            success: true,
            newBadges,
            message: newBadges.length > 0 ? `${newBadges.length} new badge(s) awarded!` : 'No new badges earned',
        });
    } catch (error: any) {
        console.error('Error calculating badges:', error);
        res.status(500).json({ error: error.message });
    }
};
