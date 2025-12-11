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
 * Create PayPal order for subscription
 * POST /api/subscriptions/payment/paypal/create-order
 */
router.post('/payment/paypal/create-order', authenticate, async (req: any, res) => {
    try {
        const { tierId, creatorId } = req.body;
        const userId = req.user.id;

        if (!tierId || !creatorId) {
            return res.status(400).json({ error: 'Missing required fields: tierId, creatorId' });
        }

        const result = await subscriptionService.createPayPalOrder(userId, creatorId, tierId);

        res.json({
            orderId: result.orderId,
            approvalUrl: result.approvalUrl,
        });
    } catch (error: any) {
        logger.error('Error creating PayPal order:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Capture PayPal payment
 * POST /api/subscriptions/payment/paypal/capture
 */
router.post('/payment/paypal/capture', authenticate, async (req: any, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user.id;

        if (!orderId) {
            return res.status(400).json({ error: 'Missing orderId' });
        }

        const subscription = await subscriptionService.capturePayPalPayment(orderId, userId);

        res.json({
            success: true,
            subscription,
        });
    } catch (error: any) {
        logger.error('Error capturing PayPal payment:', error);
        res.status(400).json({ error: error.message });
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
