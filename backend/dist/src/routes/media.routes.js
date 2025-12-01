"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_service_1 = require("../services/media.service");
const deduplication_service_1 = require("../services/deduplication.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const mediaService = new media_service_1.MediaService();
const deduplicationService = new deduplication_service_1.DeduplicationService();
// Get user media statistics
router.get('/stats', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await mediaService.getUserMediaStats(userId);
        res.json({ success: true, stats });
    }
    catch (error) {
        console.error('Error fetching media stats:', error);
        res.status(500).json({ error: 'Failed to fetch media statistics' });
    }
});
// Optimize user media
router.post('/optimize', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const processed = await mediaService.processUserMedia(userId);
        res.json({ success: true, processed });
    }
    catch (error) {
        console.error('Error optimizing media:', error);
        res.status(500).json({ error: 'Failed to optimize media' });
    }
});
// Run deduplication
router.post('/deduplicate', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await deduplicationService.deduplicateAll(userId);
        res.json({ success: true, ...result });
    }
    catch (error) {
        console.error('Error deduplicating:', error);
        res.status(500).json({ error: 'Failed to deduplicate data' });
    }
});
exports.default = router;
