import { Request, Response } from 'express';
import { StoryMergerService } from '../services/story-merger.service';

/**
 * Create merged chapter
 * POST /api/mergers/create
 */
export const createMergedChapter = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { collaboratorId, chapterAId, chapterBId, invitationId, revenueSplit } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const mergedChapter = await StoryMergerService.createMergedChapter(
            userId,
            collaboratorId,
            chapterAId,
            chapterBId,
            invitationId,
            revenueSplit
        );

        res.status(201).json(mergedChapter);
    } catch (error: any) {
        console.error('Error creating merged chapter:', error);
        res.status(500).json({ error: error.message || 'Failed to create merged chapter' });
    }
};

/**
 * Get user's merged chapters
 * GET /api/mergers
 */
export const getMergedChapters = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const chapters = await StoryMergerService.getUserMergedChapters(userId);

        res.json({ count: chapters.length, chapters });
    } catch (error: any) {
        console.error('Error getting merged chapters:', error);
        res.status(500).json({ error: error.message || 'Failed to get merged chapters' });
    }
};

/**
 * Lock chapter for editing
 * POST /api/mergers/:id/lock
 */
export const lockChapter = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const lock = await StoryMergerService.lockForEditing(id, userId);

        res.json(lock);
    } catch (error: any) {
        console.error('Error locking chapter:', error);
        res.status(423).json({ error: error.message || 'Failed to lock chapter' });
    }
};

/**
 * Unlock chapter
 * POST /api/mergers/:id/unlock
 */
export const unlockChapter = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await StoryMergerService.unlockChapter(id, userId);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error unlocking chapter:', error);
        res.status(500).json({ error: error.message || 'Failed to unlock chapter' });
    }
};

/**
 * Update merged chapter content
 * PUT /api/mergers/:id
 */
export const updateMergedChapter = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;
        const updates = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const updated = await StoryMergerService.updateContent(id, userId, updates);

        res.json(updated);
    } catch (error: any) {
        console.error('Error updating merged chapter:', error);
        res.status(500).json({ error: error.message || 'Failed to update merged chapter' });
    }
};

/**
 * Request deletion (requires mutual consent)
 * DELETE /api/mergers/:id
 */
export const requestDeletion = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await StoryMergerService.requestDeletion(id, userId);

        res.json(result);
    } catch (error: any) {
        console.error('Error requesting deletion:', error);
        res.status(500).json({ error: error.message || 'Failed to request deletion' });
    }
};

/**
 * Get revenue distribution for merged chapter
 * GET /api/mergers/:id/revenue
 */
export const getRevenueDistribution = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const chapter = await StoryMergerService.getUserMergedChapters(userId);
        const found = chapter.find((c) => c.id === id);

        if (!found) {
            return res.status(404).json({ error: 'Merged chapter not found' });
        }

        res.json({
            totalEarnings: found.totalEarnings,
            revenueSplitRatio: found.revenueSplitRatio,
            creatorAEarnings: found.creatorAEarnings,
            creatorBEarnings: found.creatorBEarnings,
        });
    } catch (error: any) {
        console.error('Error getting revenue distribution:', error);
        res.status(500).json({ error: error.message || 'Failed to get revenue distribution' });
    }
};
