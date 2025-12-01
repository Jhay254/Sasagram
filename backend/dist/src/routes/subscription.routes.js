"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_service_1 = require("../services/subscription/subscription.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * Create a new subscription
 * POST /api/subscriptions/create
 */
router.post('/create', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { creatorId, tierId } = req.body;
        const userId = req.user.id;
        if (!creatorId || !tierId) {
            return res.status(400).json({ error: 'Missing required fields: creatorId, tierId' });
        }
        // Default to PayPal for MVP
        const result = await subscription_service_1.subscriptionService.createSubscription(userId, creatorId, tierId, 'paypal');
        res.json({
            subscription: result.subscription,
            approvalUrl: result.approvalUrl,
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating subscription:', error);
        res.status(400).json({ error: error.message });
    }
});
/**
 * Cancel a subscription
 * POST /api/subscriptions/:id/cancel
 */
router.post('/:id/cancel', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const userId = req.user.id;
        await subscription_service_1.subscriptionService.cancelSubscription(subscriptionId, userId);
        res.json({ success: true, message: 'Subscription canceled successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error canceling subscription:', error);
        res.status(400).json({ error: error.message });
    }
});
/**
 * Get user's subscriptions
 * GET /api/subscriptions/my-subscriptions
 */
router.get('/my-subscriptions', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const subscriptions = await subscription_service_1.subscriptionService.getUserSubscriptions(userId);
        res.json(subscriptions);
    }
    catch (error) {
        logger_1.logger.error('Error fetching user subscriptions:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});
/**
 * Get creator's subscribers (for creators)
 * GET /api/subscriptions/subscribers
 */
router.get('/subscribers', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const creatorId = req.user.id;
        const subscribers = await subscription_service_1.subscriptionService.getCreatorSubscribers(creatorId);
        res.json(subscribers);
    }
    catch (error) {
        logger_1.logger.error('Error fetching subscribers:', error);
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
        const signature = req.headers['paypal-transmission-sig'] || '';
        await subscription_service_1.subscriptionService.handleWebhook('paypal', payload, signature);
        res.sendStatus(200);
    }
    catch (error) {
        logger_1.logger.error('Error handling PayPal webhook:', error);
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
