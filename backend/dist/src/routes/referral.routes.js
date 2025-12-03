"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const referral_service_1 = require("../services/growth/referral.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * GET /api/referral/code
 * Get or generate user's referral code and stats
 */
router.get('/code', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        // Ensure code exists
        await referral_service_1.referralService.generateReferralCode(userId);
        const stats = await referral_service_1.referralService.getReferralStats(userId);
        res.json(stats);
    }
    catch (error) {
        logger_1.default.error('Error fetching referral code:', error);
        res.status(500).json({ error: 'Failed to fetch referral code' });
    }
});
/**
 * POST /api/referral/redeem
 * Redeem a referral code (usually called during onboarding, but can be post-signup)
 */
router.post('/redeem', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Referral code is required' });
        }
        const success = await referral_service_1.referralService.processReferral(code, userId);
        if (success) {
            res.json({ message: 'Referral code redeemed successfully' });
        }
        else {
            res.status(400).json({ error: 'Invalid referral code or already redeemed' });
        }
    }
    catch (error) {
        logger_1.default.error('Error redeeming referral code:', error);
        res.status(500).json({ error: 'Failed to redeem referral code' });
    }
});
/**
 * GET /api/referral/stats
 * Get referral statistics for the current user
 */
router.get('/stats', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await referral_service_1.referralService.getReferralStats(userId);
        res.json(stats);
    }
    catch (error) {
        logger_1.default.error('Error fetching referral stats:', error);
        res.status(500).json({ error: 'Failed to fetch referral stats' });
    }
});
/**
 * POST /api/referral/generate
 * Generate a referral code for the current user
 */
router.post('/generate', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const code = await referral_service_1.referralService.generateReferralCode(userId);
        res.json({ code });
    }
    catch (error) {
        logger_1.default.error('Error generating referral code:', error);
        res.status(500).json({ error: 'Failed to generate referral code' });
    }
});
exports.default = router;
