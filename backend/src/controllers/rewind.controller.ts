import { Request, Response } from 'express';
import { RewindService } from '../services/rewind.service';
import { parseISO } from 'date-fns';

/**
 * Get day snapshot
 * GET /api/rewind/day/:date
 */
export const getDaySnapshot = async (req: Request, res: Response) => {
    try {
        const { date } = req.params;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const targetDate = parseISO(date);
        const snapshot = await RewindService.getDaySnapshot(userId, targetDate);

        res.json(snapshot);
    } catch (error: any) {
        console.error('Error getting day snapshot:', error);

        if (error.message.includes('Location tracking')) {
            return res.status(403).json({ error: error.message });
        }

        if (error.message.includes('5-year limit')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: error.message || 'Failed to get day snapshot' });
    }
};

/**
 * Get swipeable timeline
 * GET /api/rewind/timeline?date=YYYY-MM-DD
 */
export const getTimeline = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const dateParam = req.query.date as string;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const targetDate = dateParam ? parseISO(dateParam) : new Date();
        const timeline = await RewindService.getSwipeableTimeline(userId, targetDate);

        res.json({
            targetDate: targetDate.toISOString(),
            snapshots: timeline,
        });
    } catch (error: any) {
        console.error('Error getting timeline:', error);
        res.status(500).json({ error: error.message || 'Failed to get timeline' });
    }
};

/**
 * Get "On This Day" memories
 * GET /api/rewind/on-this-day
 */
export const getOnThisDay = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const memories = await RewindService.findOnThisDayMemories(userId);

        res.json({
            count: memories.length,
            memories,
        });
    } catch (error: any) {
        console.error('Error getting On This Day memories:', error);
        res.status(500).json({ error: error.message || 'Failed to get memories' });
    }
};

/**
 * Get daily random memory
 * GET /api/rewind/random-memory
 */
export const getRandomMemory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const memory = await RewindService.generateDailyRandomMemory(userId);

        if (!memory) {
            return res.status(404).json({ message: 'No memories found for today' });
        }

        res.json(memory);
    } catch (error: any) {
        console.error('Error getting random memory:', error);
        res.status(500).json({ error: error.message || 'Failed to get random memory' });
    }
};

/**
 * Generate past vs. present comparison
 * POST /api/rewind/comparison
 */
export const generateComparison = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { pastDate, presentDate } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!pastDate) {
            return res.status(400).json({ error: 'pastDate is required' });
        }

        const past = parseISO(pastDate);
        const present = presentDate ? parseISO(presentDate) : new Date();

        const comparison = await RewindService.generateComparison(userId, past, present);

        res.json(comparison);
    } catch (error: any) {
        console.error('Error generating comparison:', error);
        res.status(500).json({ error: error.message || 'Failed to generate comparison' });
    }
};

/**
 * Get rewind preferences
 * GET /api/rewind/preferences
 */
export const getPreferences = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const preferences = await RewindService.getPreferences(userId);

        res.json(preferences);
    } catch (error: any) {
        console.error('Error getting preferences:', error);
        res.status(500).json({ error: error.message || 'Failed to get preferences' });
    }
};

/**
 * Update rewind preferences
 * PUT /api/rewind/preferences
 */
export const updatePreferences = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const updates = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const preferences = await RewindService.updatePreferences(userId, updates);

        res.json({
            success: true,
            preferences,
        });
    } catch (error: any) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: error.message || 'Failed to update preferences' });
    }
};
