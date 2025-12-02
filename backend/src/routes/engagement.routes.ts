import { Router } from 'express';
import { chapterService } from '../services/engagement/chapter.service';
import { feedService } from '../services/engagement/feed.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

// ==========================================
// CHAPTER ROUTES
// ==========================================

/**
 * POST /api/engagement/chapters
 * Create/Start a new chapter
 */
router.post('/chapters', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { title, content, startDate, endDate } = req.body;

        if (!title || !startDate) {
            return res.status(400).json({ error: 'Missing required fields: title, startDate' });
        }

        const chapter = await chapterService.createChapter(userId, {
            title,
            content,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
        });

        res.json(chapter);
    } catch (error) {
        logger.error('Error creating chapter:', error);
        res.status(500).json({ error: 'Failed to create chapter' });
    }
});

/**
 * POST /api/engagement/chapters/:id/complete
 * Complete a chapter
 */
router.post('/chapters/:id/complete', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { trigger } = req.body;

        const chapter = await chapterService.completeChapter(id, trigger);
        res.json(chapter);
    } catch (error) {
        logger.error('Error completing chapter:', error);
        res.status(500).json({ error: 'Failed to complete chapter' });
    }
});

/**
 * GET /api/engagement/chapters/active
 * Get active chapter for current user
 */
router.get('/chapters/active', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const chapter = await chapterService.getActiveChapter(userId);
        res.json(chapter || null);
    } catch (error) {
        logger.error('Error fetching active chapter:', error);
        res.status(500).json({ error: 'Failed to fetch active chapter' });
    }
});

/**
 * GET /api/engagement/chapters
 * Get all chapters for current user
 */
router.get('/chapters', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const chapters = await chapterService.getUserChapters(userId);
        res.json(chapters);
    } catch (error) {
        logger.error('Error fetching chapters:', error);
        res.status(500).json({ error: 'Failed to fetch chapters' });
    }
});

// ==========================================
// FEED ROUTES
// ==========================================

/**
 * POST /api/engagement/feed
 * Create a new feed entry
 */
router.post('/feed', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { content, mood, location, mediaUrls, isPublic } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const entry = await feedService.createEntry(userId, {
            content,
            mood,
            location,
            mediaUrls,
            isPublic,
        });

        res.json(entry);
    } catch (error) {
        logger.error('Error creating feed entry:', error);
        res.status(500).json({ error: 'Failed to create feed entry' });
    }
});

/**
 * GET /api/engagement/feed
 * Get aggregated feed
 */
router.get('/feed', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const feed = await feedService.getFeed(userId, page, limit);
        res.json(feed);
    } catch (error) {
        logger.error('Error fetching feed:', error);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

export default router;
