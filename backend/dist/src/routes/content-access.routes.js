"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const content_access_service_1 = require("../services/content/content-access.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * Set access level for a chapter (Creator only)
 * POST /api/content-access/chapter/:chapterId
 */
router.post('/chapter/:chapterId', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { chapterId } = req.params;
        const { accessLevel } = req.body; // 'public', 'private', 'bronze', 'gold'
        const creatorId = req.user.id;
        // TODO: Verify chapter ownership here (would need ChapterService)
        // For now assuming if they are authenticated they are the creator of the chapter
        // In production, fetch chapter and check creatorId
        if (!['public', 'private', 'bronze', 'gold'].includes(accessLevel)) {
            return res.status(400).json({ error: 'Invalid access level' });
        }
        await content_access_service_1.contentAccessService.setChapterAccess(chapterId, creatorId, accessLevel);
        res.json({ success: true, message: `Access level set to ${accessLevel}` });
    }
    catch (error) {
        logger_1.logger.error('Error setting chapter access:', error);
        res.status(500).json({ error: 'Failed to set access level' });
    }
});
/**
 * Bulk set access levels
 * POST /api/content-access/bulk
 */
router.post('/bulk', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { chapters } = req.body; // Array of { chapterId, accessLevel }
        const creatorId = req.user.id;
        if (!Array.isArray(chapters)) {
            return res.status(400).json({ error: 'Invalid chapters array' });
        }
        await content_access_service_1.contentAccessService.bulkSetChapterAccess(chapters, creatorId);
        res.json({ success: true, message: `Updated ${chapters.length} chapters` });
    }
    catch (error) {
        logger_1.logger.error('Error bulk updating access:', error);
        res.status(500).json({ error: 'Failed to update access levels' });
    }
});
/**
 * Get access configuration for creator's chapters
 * GET /api/content-access/config
 */
router.get('/config', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const creatorId = req.user.id;
        const config = await content_access_service_1.contentAccessService.getCreatorChapterAccess(creatorId);
        res.json(config);
    }
    catch (error) {
        logger_1.logger.error('Error fetching access config:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});
/**
 * Get preview content for a locked chapter
 * GET /api/content-access/preview/:chapterId
 */
router.get('/preview/:chapterId', async (req, res) => {
    try {
        const { chapterId } = req.params;
        // In a real implementation, we would fetch the chapter content here
        // For now, we'll return a placeholder or need to integrate with ChapterService
        // Placeholder logic
        const mockContent = "This is a preview of the chapter content. The full content is locked behind a paywall. Subscribe to read more...";
        const preview = content_access_service_1.contentAccessService.getPreviewContent(mockContent);
        res.json({ preview });
    }
    catch (error) {
        logger_1.logger.error('Error fetching preview:', error);
        res.status(500).json({ error: 'Failed to fetch preview' });
    }
});
exports.default = router;
