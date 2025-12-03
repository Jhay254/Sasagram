import { Router } from 'express';
import { referralService } from '../services/growth/referral.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/referral/code
 * Get or generate user's referral code and stats
 */
router.get('/code', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;

        // Ensure code exists
        await referralService.generateReferralCode(userId);

        const stats = await referralService.getReferralStats(userId);
        res.json(stats);
    } catch (error) {
        logger.error('Error fetching referral code:', error);
        res.status(500).json({ error: 'Failed to fetch referral code' });
    }
});

/**
 * POST /api/referral/redeem
 * Redeem a referral code (usually called during onboarding, but can be post-signup)
 */
router.post('/redeem', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Referral code is required' });
        }

        const success = await referralService.processReferral(code, userId);

        if (success) {
            res.json({ message: 'Referral code redeemed successfully' });
        } else {
            res.status(400).json({ error: 'Invalid referral code or already redeemed' });
        }
    } catch (error) {
        logger.error('Error redeeming referral code:', error);
        res.status(500).json({ error: 'Failed to redeem referral code' });
    }
});

/**
 * GET /api/referral/stats
 * Get referral statistics for the current user
 */
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const stats = await referralService.getReferralStats(userId);
        res.json(stats);
    } catch (error) {
        logger.error('Error fetching referral stats:', error);
        res.status(500).json({ error: 'Failed to fetch referral stats' });
    }
});

/**
 * POST /api/referral/generate
 * Generate a referral code for the current user
 */
router.post('/generate', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const code = await referralService.generateReferralCode(userId);
        res.json({ code });
    } catch (error) {
        logger.error('Error generating referral code:', error);
        res.status(500).json({ error: 'Failed to generate referral code' });
    }
});

export default router;
