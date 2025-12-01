import { Router } from 'express';
import { taggingService } from '../services/network/tagging.service';
import { authenticateToken } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/tags
 * Tag a user in an event
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const taggerId = req.user!.userId;
        const { taggedUserEmail, eventId, eventTitle, eventDate, message } = req.body;

        if (!taggedUserEmail || !eventId || !eventTitle || !eventDate) {
            return res.status(400).json({
                error: 'Missing required fields: taggedUserEmail, eventId, eventTitle, eventDate',
            });
        }

        const tag = await taggingService.tagUser(taggerId, taggedUserEmail, {
            eventId,
            eventTitle,
            eventDate: new Date(eventDate),
            message,
        });

        res.json(tag);
    } catch (error) {
        logger.error('Error creating tag:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

/**
 * GET /api/tags/pending
 * Get pending tags for current user
 */
router.get('/pending', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const tags = await taggingService.getPendingTags(userId);
        res.json(tags);
    } catch (error) {
        logger.error('Error fetching pending tags:', error);
        res.status(500).json({ error: 'Failed to fetch pending tags' });
    }
});

/**
 * GET /api/tags/my-tags
 * Get all tags for current user (made and received)
 */
router.get('/my-tags', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const tags = await taggingService.getUserTags(userId);
        res.json(tags);
    } catch (error) {
        logger.error('Error fetching user tags:', error);
        res.status(500).json({ error: 'Failed to fetch user tags' });
    }
});

/**
 * POST /api/tags/:tagId/verify
 * Verify/accept a tag
 */
router.post('/:tagId/verify', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const { tagId } = req.params;
        const { perspective, photos, details } = req.body;

        if (!perspective) {
            return res.status(400).json({
                error: 'Missing required field: perspective',
            });
        }

        const tag = await taggingService.verifyTag(tagId, userId, {
            perspective,
            photos,
            details,
        });

        res.json(tag);
    } catch (error: any) {
        logger.error('Error verifying tag:', error);
        res.status(error.message.includes('unauthorized') ? 403 : 500).json({
            error: error.message || 'Failed to verify tag',
        });
    }
});

/**
 * POST /api/tags/:tagId/decline
 * Decline a tag
 */
router.post('/:tagId/decline', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const { tagId } = req.params;

        const tag = await taggingService.declineTag(tagId, userId);
        res.json(tag);
    } catch (error: any) {
        logger.error('Error declining tag:', error);
        res.status(error.message.includes('unauthorized') ? 403 : 500).json({
            error: error.message || 'Failed to decline tag',
        });
    }
});

export default router;
