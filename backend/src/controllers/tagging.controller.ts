import { Request, Response } from 'express';
import { TaggingService } from '../services/tagging.service';

/**
 * Create a new tag for an event
 */
export async function createTag(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { eventId, taggedUserIds, message } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const tags = await TaggingService.tagMultipleUsers(
            userId,
            eventId,
            taggedUserIds,
            message
        );

        res.json({
            success: true,
            message: `Successfully tagged ${tags.length} user(s)`,
            data: tags,
        });
    } catch (error: any) {
        console.error('Error creating tag:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get pending tags for current user
 */
export async function getPendingTags(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const tags = await TaggingService.getPendingTags(userId);

        res.json({
            success: true,
            data: tags,
        });
    } catch (error: any) {
        console.error('Error getting pending tags:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Verify a tag
 */
export async function verifyTag(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { tagId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await TaggingService.verifyTag(tagId, userId);

        res.json({
            success: true,
            message: 'Tag verified successfully',
        });
    } catch (error: any) {
        console.error('Error verifying tag:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Decline a tag
 */
export async function declineTag(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { tagId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await TaggingService.declineTag(tagId, userId);

        res.json({
            success: true,
            message: 'Tag declined',
        });
    } catch (error: any) {
        console.error('Error declining tag:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Add perspective to a tag
 */
export async function addPerspective(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { tagId } = req.params;
        const { perspective, photos, audioUrl } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const tagPerspective = await TaggingService.addPerspective(
            tagId,
            userId,
            perspective,
            photos,
            audioUrl
        );

        res.json({
            success: true,
            message: 'Perspective added successfully',
            data: tagPerspective,
        });
    } catch (error: any) {
        console.error('Error adding perspective:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get tags for an event
 */
export async function getEventTags(req: Request, res: Response) {
    try {
        const { eventId } = req.params;

        const tags = await TaggingService.getEventTags(eventId);

        res.json({
            success: true,
            data: tags,
        });
    } catch (error: any) {
        console.error('Error getting event tags:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get user's memory completeness score
 */
export async function getMemoryCompleteness(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const score = await TaggingService.calculateMemoryCompleteness(userId);

        res.json({
            success: true,
            data: { score },
        });
    } catch (error: any) {
        console.error('Error getting memory completeness:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(req: Request, res: Response) {
    try {
        const { limit = 100 } = req.query;

        const leaderboard = await TaggingService.getLeaderboard(Number(limit));

        res.json({
            success: true,
            data: leaderboard,
        });
    } catch (error: any) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get verification stats for user
 */
export async function getVerificationStats(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const stats = await TaggingService.getVerificationStats(userId);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        console.error('Error getting verification stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
