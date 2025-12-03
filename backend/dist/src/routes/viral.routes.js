"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const video_service_1 = require("../services/viral/video.service");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
/**
 * POST /api/viral/snippets/generate
 * Generate a video snippet
 */
router.post('/snippets/generate', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { chapterId, templateId, data } = req.body;
        // Combine request data with defaults
        const compositionData = {
            chapterId,
            templateId,
            title: data.title,
            images: data.images,
            videos: [],
            durationInSeconds: 15, // Default
        };
        const result = await video_service_1.videoService.generateSnippet(compositionData);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error generating snippet:', error);
        res.status(500).json({ error: 'Failed to generate snippet' });
    }
});
/**
 * GET /api/viral/chapters/:id/highlights
 * Get AI-extracted highlights for a chapter
 */
router.get('/chapters/:id/highlights', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const highlights = await video_service_1.videoService.extractHighlights(id);
        res.json(highlights);
    }
    catch (error) {
        logger_1.default.error('Error fetching highlights:', error);
        res.status(500).json({ error: 'Failed to fetch highlights' });
    }
});
exports.default = router;
