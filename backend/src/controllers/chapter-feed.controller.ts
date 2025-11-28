import { Request, Response } from 'express';
import { ChapterFeedService } from '../services/chapter-feed.service';
import { UpdateType } from '@prisma/client';

/**
 * Get updates for a specific chapter
 * GET /api/chapters/:id/updates
 */
export const getChapterUpdates = async (req: Request, res: Response) => {
    try {
        const { id: chapterId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const updates = await ChapterFeedService.getChapterUpdates(chapterId, limit, offset);

        res.json({
            count: updates.length,
            updates,
        });
    } catch (error: any) {
        console.error('Error getting chapter updates:', error);
        res.status(500).json({ error: error.message || 'Failed to get updates' });
    }
};

/**
 * Get living feed for a biography
 * GET /api/biographies/:id/feed
 */
export const getBiographyFeed = async (req: Request, res: Response) => {
    try {
        const { id: biographyId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const feed = await ChapterFeedService.getBiographyFeed(biographyId, limit, offset);

        res.json({
            count: feed.length,
            updates: feed,
        });
    } catch (error: any) {
        console.error('Error getting biography feed:', error);
        res.status(500).json({ error: error.message || 'Failed to get feed' });
    }
};

/**
 * Get aggregated feed from all followed creators
 * GET /api/feed/following
 */
export const getFollowingFeed = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const feed = await ChapterFeedService.getFollowingFeed(userId, limit, offset);

        res.json({
            count: feed.length,
            updates: feed,
        });
    } catch (error: any) {
        console.error('Error getting following feed:', error);
        res.status(500).json({ error: error.message || 'Failed to get feed' });
    }
};

/**
 * Create a micro-update for a chapter
 * POST /api/chapters/:id/micro-update
 */
export const createMicroUpdate = async (req: Request, res: Response) => {
    try {
        const { id: chapterId } = req.params;
        const { summary, content, updateType } = req.body;

        if (!summary) {
            return res.status(400).json({ error: 'Summary is required' });
        }

        const validUpdateTypes: UpdateType[] = ['MICRO_UPDATE', 'EDIT', 'ADDITION', 'CORRECTION'];
        const type: UpdateType = validUpdateTypes.includes(updateType) ? updateType : 'MICRO_UPDATE';

        const update = await ChapterFeedService.createMicroUpdate(
            chapterId,
            summary,
            content,
            type
        );

        res.json({
            success: true,
            update,
        });
    } catch (error: any) {
        console.error('Error creating micro-update:', error);
        res.status(500).json({ error: error.message || 'Failed to create update' });
    }
};

/**
 * Create a correction/errata
 * POST /api/chapters/:id/correction
 */
export const createCorrection = async (req: Request, res: Response) => {
    try {
        const { id: chapterId } = req.params;
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Correction description is required' });
        }

        const update = await ChapterFeedService.createCorrection(chapterId, description);

        res.json({
            success: true,
            update,
        });
    } catch (error: any) {
        console.error('Error creating correction:', error);
        res.status(500).json({ error: error.message || 'Failed to create correction' });
    }
};

/**
 * Delete an update
 * DELETE /api/updates/:id
 */
export const deleteUpdate = async (req: Request, res: Response) => {
    try {
        const { id: updateId } = req.params;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await ChapterFeedService.deleteUpdate(updateId, userId);

        res.json({
            success: true,
            message: 'Update deleted',
        });
    } catch (error: any) {
        console.error('Error deleting update:', error);
        res.status(500).json({ error: error.message || 'Failed to delete update' });
    }
};

/**
 * Get update count for a chapter
 * GET /api/chapters/:id/update-count
 */
export const getUpdateCount = async (req: Request, res: Response) => {
    try {
        const { id: chapterId } = req.params;

        const count = await ChapterFeedService.getUpdateCount(chapterId);

        res.json({ chapterId, count });
    } catch (error: any) {
        console.error('Error getting update count:', error);
        res.status(500).json({ error: error.message || 'Failed to get count' });
    }
};
