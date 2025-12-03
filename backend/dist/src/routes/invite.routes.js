"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invite_service_1 = require("../services/invite.service");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /invite/{token}:
 *   get:
 *     summary: Get invite landing page data (public)
 *     tags: [Invite]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite data for landing page
 */
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const inviteData = await invite_service_1.inviteService.getInviteData(token);
        res.json({
            success: true,
            data: inviteData,
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching invite data:', error);
        res.status(400).json({
            error: error.message || 'Invalid invite link',
        });
    }
});
/**
 * @swagger
 * /invite/{token}/claim:
 *   post:
 *     summary: Claim invite and register user (public)
 *     tags: [Invite]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered and invite claimed
 */
router.post('/:token/claim', rate_limit_middleware_1.inviteClaimLimiter, async (req, res) => {
    try {
        const { token } = req.params;
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields: name, email, password',
            });
        }
        const result = await invite_service_1.inviteService.claimInvite(token, {
            name,
            email,
            password,
        });
        res.json({
            success: true,
            data: result,
            message: 'Account created successfully! You can now log in.',
        });
    }
    catch (error) {
        logger_1.default.error('Error claiming invite:', error);
        res.status(400).json({
            error: error.message || 'Failed to claim invite',
        });
    }
});
/**
 * @swagger
 * /invite/{token}/preview:
 *   get:
 *     summary: Get social sharing preview data (public)
 *     tags: [Invite]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Open Graph preview data
 */
router.get('/:token/preview', async (req, res) => {
    try {
        const { token } = req.params;
        const preview = await invite_service_1.inviteService.generateSocialPreview(token);
        res.json({
            success: true,
            data: preview,
        });
    }
    catch (error) {
        logger_1.default.error('Error generating preview:', error);
        res.status(400).json({
            error: error.message || 'Failed to generate preview',
        });
    }
});
exports.default = router;
