import { Router } from 'express';
import { revenueService } from '../services/revenue/revenue.service';
import { authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get creator revenue metrics
 * GET /api/revenue/metrics
 */
router.get('/metrics', authenticate, async (req: any, res) => {
    try {
        const creatorId = req.user.id;
        const metrics = await revenueService.getCreatorMetrics(creatorId);
        res.json(metrics);
    } catch (error: any) {
        logger.error('Error fetching revenue metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

/**
 * Get earnings history
 * GET /api/revenue/earnings?months=12
 */
router.get('/earnings', authenticate, async (req: any, res) => {
    try {
        const creatorId = req.user.id;
        const months = req.query.months ? parseInt(req.query.months as string) : 12;

        const history = await revenueService.getEarningsHistory(creatorId, months);
        res.json(history);
    } catch (error: any) {
        logger.error('Error fetching earnings history:', error);
        res.status(500).json({ error: 'Failed to fetch earnings history' });
    }
});

/**
 * Get pending payout amount
 * GET /api/revenue/payout/pending
 */
router.get('/payout/pending', authenticate, async (req: any, res) => {
    try {
        const creatorId = req.user.id;
        const amount = await revenueService.getPendingPayout(creatorId);
        res.json({ amount, currency: 'USD' });
    } catch (error: any) {
        logger.error('Error fetching pending payout:', error);
        res.status(500).json({ error: 'Failed to fetch pending payout' });
    }
});

/**
 * Request a payout
 * POST /api/revenue/payout/request
 */
router.post('/payout/request', authenticate, async (req: any, res) => {
    try {
        const creatorId = req.user.id;
        const payout = await revenueService.requestPayout(creatorId);
        res.json(payout);
    } catch (error: any) {
        logger.error('Error requesting payout:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
