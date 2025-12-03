"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const watermark_service_1 = require("../services/protection/watermark.service");
const screenshot_service_1 = require("../services/protection/screenshot.service");
const blockchain_service_1 = require("../services/protection/blockchain.service");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
/**
 * POST /api/protection/watermark/create
 * Create a watermark for content
 */
router.post('/watermark/create', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { contentId, subscriberId, type } = req.body;
        if (!contentId || !subscriberId) {
            return res.status(400).json({ error: 'contentId and subscriberId are required' });
        }
        const watermark = await watermark_service_1.watermarkService.createWatermark(contentId, subscriberId, type);
        res.json(watermark);
    }
    catch (error) {
        logger_1.default.error('Error creating watermark:', error);
        res.status(500).json({ error: 'Failed to create watermark' });
    }
});
/**
 * GET /api/protection/watermark/:contentId
 * Get watermarks for specific content
 */
router.get('/watermark/:contentId', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { contentId } = req.params;
        const watermarks = await watermark_service_1.watermarkService.getContentWatermarks(contentId);
        res.json(watermarks);
    }
    catch (error) {
        logger_1.default.error('Error fetching watermarks:', error);
        res.status(500).json({ error: 'Failed to fetch watermarks' });
    }
});
/**
 * POST /api/protection/screenshot/report
 * Report a screenshot event
 */
router.post('/screenshot/report', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { subscriberId, creatorId, contentId } = req.body;
        if (!subscriberId || !creatorId || !contentId) {
            return res.status(400).json({ error: 'subscriberId, creatorId, and contentId are required' });
        }
        const detection = await screenshot_service_1.screenshotService.recordScreenshot(subscriberId, creatorId, contentId);
        const warningCount = await screenshot_service_1.screenshotService.getWarningCount(subscriberId);
        res.json({
            detection,
            warningCount,
            maxWarnings: 3,
        });
    }
    catch (error) {
        logger_1.default.error('Error reporting screenshot:', error);
        res.status(500).json({ error: 'Failed to report screenshot' });
    }
});
/**
 * GET /api/protection/screenshot/warnings
 * Get screenshot warnings for current user
 */
router.get('/screenshot/warnings', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const warnings = await screenshot_service_1.screenshotService.getSubscriberWarnings(userId);
        const count = await screenshot_service_1.screenshotService.getWarningCount(userId);
        res.json({
            warnings,
            count,
            maxWarnings: 3,
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching warnings:', error);
        res.status(500).json({ error: 'Failed to fetch warnings' });
    }
});
/**
 * POST /api/protection/blockchain/hash
 * Hash content and store on blockchain
 */
router.post('/blockchain/hash', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { contentId, contentBuffer } = req.body;
        if (!contentId || !contentBuffer) {
            return res.status(400).json({ error: 'contentId and contentBuffer are required' });
        }
        // Convert base64 string to buffer if needed
        const buffer = Buffer.isBuffer(contentBuffer)
            ? contentBuffer
            : Buffer.from(contentBuffer, 'base64');
        const contentHash = await blockchain_service_1.blockchainService.createContentHash(contentId, buffer);
        res.json(contentHash);
    }
    catch (error) {
        logger_1.default.error('Error hashing content:', error);
        res.status(500).json({ error: 'Failed to hash content' });
    }
});
/**
 * GET /api/protection/blockchain/verify/:hash
 * Verify content authenticity
 */
router.get('/blockchain/verify/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const verification = await blockchain_service_1.blockchainService.verifyContent(hash);
        res.json(verification);
    }
    catch (error) {
        logger_1.default.error('Error verifying content:', error);
        res.status(500).json({ error: 'Failed to verify content' });
    }
});
/**
 * GET /api/protection/blockchain/badge/:contentId
 * Get trust badge for content
 */
router.get('/blockchain/badge/:contentId', async (req, res) => {
    try {
        const { contentId } = req.params;
        const badge = await blockchain_service_1.blockchainService.generateTrustBadge(contentId);
        if (!badge) {
            return res.status(404).json({ error: 'Trust badge not available for this content' });
        }
        res.json(badge);
    }
    catch (error) {
        logger_1.default.error('Error generating trust badge:', error);
        res.status(500).json({ error: 'Failed to generate trust badge' });
    }
});
exports.default = router;
