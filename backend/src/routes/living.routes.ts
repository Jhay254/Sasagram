import { Router } from 'express';
import { livingFeedService } from '../services/engagement/living-feed.service';
import { chapterAIService } from '../services/ai/chapter-ai.service';
import { schedulerService } from '../services/engagement/scheduler.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

// ==========================================
// LIVING FEED ROUTES
// ==========================================

/**
 * GET /api/living/feed
 * Get aggregated living feed
 */
router.get('/feed', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const feed = await livingFeedService.getFeed(userId, page, limit);
        res.json(feed);
    } catch (error: any) {
        logger.error('Error fetching living feed:', error);
        res.status(500).json({ error: 'Failed to fetch living feed' });
    }
});

/**
 * POST /api/living/feed
 * Create a new feed entry
 */
router.post('/feed', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { content, mood, location, mediaUrls, isPublic } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const entry = await livingFeedService.createEntry(userId, {
            content,
            mood,
            location,
            mediaUrls,
            isPublic,
        });

        res.json(entry);
    } catch (error: any) {
        logger.error('Error creating feed entry:', error);
        res.status(500).json({ error: error.message || 'Failed to create feed entry' });
    }
});

/**
 * GET /api/living/chapters/:id/feed
 * Get feed for a specific chapter
 */
router.get('/chapters/:id/feed', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const feed = await livingFeedService.getChapterFeed(id);
        res.json(feed);
    } catch (error: any) {
        logger.error('Error fetching chapter feed:', error);
        res.status(500).json({ error: 'Failed to fetch chapter feed' });
    }
});

// ==========================================
// AI & SCHEDULER ROUTES
// ==========================================

/**
 * POST /api/living/ai/detect-completion
 * Check for chapter completion signals
 */
router.post('/ai/detect-completion', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const signal = await chapterAIService.detectCompletion(userId);
        res.json({ signal });
    } catch (error: any) {
        logger.error('Error detecting completion:', error);
        res.status(500).json({ error: 'Failed to detect completion' });
    }
});

/**
 * POST /api/living/chapters/:id/schedule
 * Schedule episodic release
 */
router.post('/chapters/:id/schedule', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { frequency, day, time } = req.body;

        if (!frequency) {
            return res.status(400).json({ error: 'Frequency is required' });
        }

        const result = await schedulerService.scheduleRelease(id, {
            frequency,
            day,
            time,
        });

        res.json(result);
    } catch (error: any) {
        logger.error('Error scheduling release:', error);
        res.status(500).json({ error: 'Failed to schedule release' });
    }
});

export default router;
