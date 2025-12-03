import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { videoService } from '../services/viral/video.service';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/viral/snippets/generate
 * Generate a video snippet
 */
router.post('/snippets/generate', authenticate, async (req: AuthRequest, res) => {
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

        const result = await videoService.generateSnippet(compositionData);
        res.json(result);
    } catch (error) {
        logger.error('Error generating snippet:', error);
        res.status(500).json({ error: 'Failed to generate snippet' });
    }
});

/**
 * GET /api/viral/chapters/:id/highlights
 * Get AI-extracted highlights for a chapter
 */
router.get('/chapters/:id/highlights', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const highlights = await videoService.extractHighlights(id);
        res.json(highlights);
    } catch (error) {
        logger.error('Error fetching highlights:', error);
        res.status(500).json({ error: 'Failed to fetch highlights' });
    }
});

export default router;
