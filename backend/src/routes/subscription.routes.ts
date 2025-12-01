import { Router } from 'express';
import { subscriptionService } from '../services/subscription/subscription.service';
import { authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Create a new subscription
 * POST /api/subscriptions/create
 */
router.post('/create', authenticate, async (req: any, res) => {
    try {
        const { creatorId, tierId } = req.body;
        const userId = req.user.id;

        if (!creatorId || !tierId) {
            return res.status(400).json({ error: 'Missing required fields: creatorId, tierId' });
        }

        // Default to PayPal for MVP
        const result = await subscriptionService.createSubscription(
            userId,
            creatorId,
            tierId,
            'paypal'
        );

        res.json({
            subscription: result.subscription,
            approvalUrl: result.approvalUrl,
        });
    } catch (error: any) {
        logger.error('Error creating subscription:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Cancel a subscription
 * POST /api/subscriptions/:id/cancel
 */
router.post('/:id/cancel', authenticate, async (req: any, res) => {
    try {
        const subscriptionId = req.params.id;
        const userId = req.user.id;

        await subscriptionService.cancelSubscription(subscriptionId, userId);

        res.json({ success: true, message: 'Subscription canceled successfully' });
    } catch (error: any) {
        logger.error('Error canceling subscription:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Get user's subscriptions
 * GET /api/subscriptions/my-subscriptions
 */
router.get('/my-subscriptions', authenticate, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const subscriptions = await subscriptionService.getUserSubscriptions(userId);
        res.json(subscriptions);
    } catch (error: any) {
        logger.error('Error fetching user subscriptions:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

/**
 * Get creator's subscribers (for creators)
 * GET /api/subscriptions/subscribers
 */
router.get('/subscribers', authenticate, async (req: any, res) => {
    try {
        const creatorId = req.user.id;
        const subscribers = await subscriptionService.getCreatorSubscribers(creatorId);
        res.json(subscribers);
    } catch (error: any) {
        logger.error('Error fetching subscribers:', error);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
});

/**
 * PayPal Webhook Handler
 * POST /api/subscriptions/webhooks/paypal
 */
router.post('/webhooks/paypal', async (req, res) => {
    try {
        const payload = req.body;
        const signature = req.headers['paypal-transmission-sig'] as string || '';

        await subscriptionService.handleWebhook('paypal', payload, signature);

        res.sendStatus(200);
    } catch (error: any) {
        logger.error('Error handling PayPal webhook:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
