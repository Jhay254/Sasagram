import { Request, Response } from 'express';
import { EngagementService } from '../services/engagement.service';

/**
 * Add bookmark
 */
export async function addBookmark(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { biographyId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const bookmark = await EngagementService.addBookmark(userId, biographyId);

        res.json({
            success: true,
            data: bookmark,
        });
    } catch (error: any) {
        console.error('Error adding bookmark:', error);
        res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Remove bookmark
 */
export async function removeBookmark(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { biographyId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await EngagementService.removeBookmark(userId, biographyId);

        res.json({
            success: true,
            message: 'Bookmark removed',
        });
    } catch (error: any) {
        console.error('Error removing bookmark:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get user's bookmarks
 */
export async function getBookmarks(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { limit = 50, offset = 0 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const bookmarks = await EngagementService.getUserBookmarks(
            userId,
            Number(limit),
            Number(offset)
        );

        res.json({
            success: true,
            data: bookmarks,
        });
    } catch (error: any) {
        console.error('Error getting bookmarks:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Update reading progress
 */
export async function updateProgress(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { biographyId, chapterId, progress } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const progressData = await EngagementService.updateProgress(
            userId,
            biographyId,
            chapterId,
            progress
        );

        res.json({
            success: true,
            data: progressData,
        });
    } catch (error: any) {
        console.error('Error updating progress:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get reading progress
 */
export async function getProgress(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { biographyId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const progress = await EngagementService.getProgress(userId, biographyId);

        res.json({
            success: true,
            data: progress,
        });
    } catch (error: any) {
        console.error('Error getting progress:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Create review
 */
export async function createReview(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { biographyId, rating, reviewText } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const review = await EngagementService.createReview(
            userId,
            biographyId,
            rating,
            reviewText
        );

        res.json({
            success: true,
            data: review,
        });
    } catch (error: any) {
        console.error('Error creating review:', error);
        res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Get biography reviews
 */
export async function getReviews(req: Request, res: Response) {
    try {
        const { biographyId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const reviews = await EngagementService.getBiographyReviews(
            biographyId,
            Number(limit),
            Number(offset)
        );

        res.json({
            success: true,
            data: reviews,
        });
    } catch (error: any) {
        console.error('Error getting reviews:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Add chapter reaction
 */
export async function addReaction(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { chapterId, reactionType } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const reaction = await EngagementService.addReaction(userId, chapterId, reactionType);

        res.json({
            success: true,
            data: reaction,
        });
    } catch (error: any) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Remove chapter reaction
 */
export async function removeReaction(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { chapterId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await EngagementService.removeReaction(userId, chapterId);

        res.json({
            success: true,
            message: 'Reaction removed',
        });
    } catch (error: any) {
        console.error('Error removing reaction:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get chapter reactions
 */
export async function getChapterReactions(req: Request, res: Response) {
    try {
        const { chapterId } = req.params;

        const reactions = await EngagementService.getChapterReactions(chapterId);

        res.json({
            success: true,
            data: reactions,
        });
    } catch (error: any) {
        console.error('Error getting reactions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
