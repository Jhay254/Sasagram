import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { watermarkService } from '../services/protection/watermark.service';
import { screenshotService } from '../services/protection/screenshot.service';
import { blockchainService } from '../services/protection/blockchain.service';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/protection/watermark/create
 * Create a watermark for content
 */
router.post('/watermark/create', authenticate, async (req: AuthRequest, res) => {
    try {
        const { contentId, subscriberId, type } = req.body;

        if (!contentId || !subscriberId) {
            return res.status(400).json({ error: 'contentId and subscriberId are required' });
        }

        const watermark = await watermarkService.createWatermark(contentId, subscriberId, type);
        res.json(watermark);
    } catch (error) {
        logger.error('Error creating watermark:', error);
        res.status(500).json({ error: 'Failed to create watermark' });
    }
});

/**
 * GET /api/protection/watermark/:contentId
 * Get watermarks for specific content
 */
router.get('/watermark/:contentId', authenticate, async (req: AuthRequest, res) => {
    try {
        const { contentId } = req.params;
        const watermarks = await watermarkService.getContentWatermarks(contentId);
        res.json(watermarks);
    } catch (error) {
        logger.error('Error fetching watermarks:', error);
        res.status(500).json({ error: 'Failed to fetch watermarks' });
    }
});

/**
 * POST /api/protection/screenshot/report
 * Report a screenshot event
 */
router.post('/screenshot/report', authenticate, async (req: AuthRequest, res) => {
    try {
        const { subscriberId, creatorId, contentId } = req.body;

        if (!subscriberId || !creatorId || !contentId) {
            return res.status(400).json({ error: 'subscriberId, creatorId, and contentId are required' });
        }

        const detection = await screenshotService.recordScreenshot(subscriberId, creatorId, contentId);
        const warningCount = await screenshotService.getWarningCount(subscriberId);

        res.json({
            detection,
            warningCount,
            maxWarnings: 3,
        });
    } catch (error) {
        logger.error('Error reporting screenshot:', error);
        res.status(500).json({ error: 'Failed to report screenshot' });
    }
});

/**
 * GET /api/protection/screenshot/warnings
 * Get screenshot warnings for current user
 */
router.get('/screenshot/warnings', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const warnings = await screenshotService.getSubscriberWarnings(userId);
        const count = await screenshotService.getWarningCount(userId);

        res.json({
            warnings,
            count,
            maxWarnings: 3,
        });
    } catch (error) {
        logger.error('Error fetching warnings:', error);
        res.status(500).json({ error: 'Failed to fetch warnings' });
    }
});

/**
 * POST /api/protection/blockchain/hash
 * Hash content and store on blockchain
 */
router.post('/blockchain/hash', authenticate, async (req: AuthRequest, res) => {
    try {
        const { contentId, contentBuffer } = req.body;

        if (!contentId || !contentBuffer) {
            return res.status(400).json({ error: 'contentId and contentBuffer are required' });
        }

        // Convert base64 string to buffer if needed
        const buffer = Buffer.isBuffer(contentBuffer)
            ? contentBuffer
            : Buffer.from(contentBuffer, 'base64');

        const contentHash = await blockchainService.createContentHash(contentId, buffer);
        res.json(contentHash);
    } catch (error) {
        logger.error('Error hashing content:', error);
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
        const verification = await blockchainService.verifyContent(hash);
        res.json(verification);
    } catch (error) {
        logger.error('Error verifying content:', error);
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
        const badge = await blockchainService.generateTrustBadge(contentId);

        if (!badge) {
            return res.status(404).json({ error: 'Trust badge not available for this content' });
        }

        res.json(badge);
    } catch (error) {
        logger.error('Error generating trust badge:', error);
        res.status(500).json({ error: 'Failed to generate trust badge' });
    }
});

export default router;
