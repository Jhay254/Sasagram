"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const revenue_service_1 = require("../services/revenue/revenue.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * Get creator revenue metrics
 * GET /api/revenue/metrics
 */
router.get('/metrics', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const creatorId = req.user.id;
        const metrics = await revenue_service_1.revenueService.getCreatorMetrics(creatorId);
        res.json(metrics);
    }
    catch (error) {
        logger_1.logger.error('Error fetching revenue metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});
/**
 * Get earnings history
 * GET /api/revenue/earnings?months=12
 */
router.get('/earnings', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const creatorId = req.user.id;
        const months = req.query.months ? parseInt(req.query.months) : 12;
        const history = await revenue_service_1.revenueService.getEarningsHistory(creatorId, months);
        res.json(history);
    }
    catch (error) {
        logger_1.logger.error('Error fetching earnings history:', error);
        res.status(500).json({ error: 'Failed to fetch earnings history' });
    }
});
/**
 * Get pending payout amount
 * GET /api/revenue/payout/pending
 */
router.get('/payout/pending', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const creatorId = req.user.id;
        const amount = await revenue_service_1.revenueService.getPendingPayout(creatorId);
        res.json({ amount, currency: 'USD' });
    }
    catch (error) {
        logger_1.logger.error('Error fetching pending payout:', error);
        res.status(500).json({ error: 'Failed to fetch pending payout' });
    }
});
/**
 * Request a payout
 * POST /api/revenue/payout/request
 */
router.post('/payout/request', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const creatorId = req.user.id;
        const payout = await revenue_service_1.revenueService.requestPayout(creatorId);
        res.json(payout);
    }
    catch (error) {
        logger_1.logger.error('Error requesting payout:', error);
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
