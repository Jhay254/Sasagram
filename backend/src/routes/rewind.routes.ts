import { Router } from 'express';
import { rewindService } from '../services/engagement/rewind.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/rewind/feed
 * Get main rewind feed
 */
router.get('/feed', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const cursor = req.query.cursor as string;
        const limit = parseInt(req.query.limit as string) || 10;

        const feed = await rewindService.getRewindFeed(userId, cursor, limit);
        res.json(feed);
    } catch (error) {
        logger.error('Error fetching rewind feed:', error);
        res.status(500).json({ error: 'Failed to fetch rewind feed' });
    }
});

/**
 * GET /api/rewind/on-this-day
 * Get content from this day in previous years
 */
router.get('/on-this-day', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const dateStr = req.query.date as string;
        const date = dateStr ? new Date(dateStr) : new Date();

        const memories = await rewindService.getMemoryComparison(userId, date);
        res.json(memories);
    } catch (error) {
        logger.error('Error fetching On This Day memories:', error);
        res.status(500).json({ error: 'Failed to fetch memories' });
    }
});

/**
 * GET /api/rewind/random
 * Get a random memory
 */
router.get('/random', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const memory = await rewindService.getRandomMemory(userId);
        res.json(memory);
    } catch (error) {
        logger.error('Error fetching random memory:', error);
        res.status(500).json({ error: 'Failed to fetch random memory' });
    }
});

/**
 * GET /api/rewind/timeline
 * Get timeline for a specific year
 */
router.get('/timeline', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const year = parseInt(req.query.year as string) || new Date().getFullYear();

        const timeline = await rewindService.getTimeline(userId, year);
        res.json(timeline);
    } catch (error) {
        logger.error('Error fetching timeline:', error);
        res.status(500).json({ error: 'Failed to fetch timeline' });
    }
});

/**
 * GET /api/rewind/map
 * Get all memories with location data
 */
router.get('/map', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const locations = await rewindService.getMemoryLocations(userId);
        res.json(locations);
    } catch (error) {
        logger.error('Error fetching memory locations:', error);
        res.status(500).json({ error: 'Failed to fetch memory locations' });
    }
});

export default router;
