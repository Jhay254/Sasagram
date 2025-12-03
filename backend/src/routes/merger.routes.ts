import { Router } from 'express';
import { storyMergerService } from '../services/network/story-merger.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/mergers
 * Create merger proposal
 */
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { collisionId } = req.body;

        if (!collisionId) {
            return res.status(400).json({
                error: 'Missing required field: collisionId',
            });
        }

        const merger = await storyMergerService.createMergerProposal(
            collisionId,
            userId
        );

        res.json(merger);
    } catch (error: any) {
        logger.error('Error creating merger:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message || 'Failed to create merger',
        });
    }
});

/**
 * POST /api/mergers/:id/approve
 * Approve merger and add perspective
 */
router.post('/:id/approve', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;
        const { narrative, photos, mood } = req.body;

        if (!narrative) {
            return res.status(400).json({
                error: 'Missing required field: narrative',
            });
        }

        const merger = await storyMergerService.approveMerger(id, userId, {
            narrative,
            photos,
            mood,
        });

        res.json(merger);
    } catch (error: any) {
        logger.error('Error approving merger:', error);
        res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
            error: error.message || 'Failed to approve merger',
        });
    }
});

/**
 * POST /api/mergers/:id/publish
 * Publish merger
 */
router.post('/:id/publish', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;

        const merger = await storyMergerService.publishMerger(id, price);
        res.json(merger);
    } catch (error: any) {
        logger.error('Error publishing merger:', error);
        res.status(500).json({
            error: error.message || 'Failed to publish merger',
        });
    }
});

/**
 * GET /api/mergers/my-mergers
 * Get user's mergers
 */
router.get('/my-mergers', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const mergers = await storyMergerService.getUserMergers(userId);
        res.json(mergers);
    } catch (error) {
        logger.error('Error fetching mergers:', error);
        res.status(500).json({ error: 'Failed to fetch mergers' });
    }
});

/**
 * GET /api/mergers/pending
 * Get pending merger proposals for user
 */
router.get('/pending', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const mergers = await storyMergerService.getPendingMergers(userId);
        res.json(mergers);
    } catch (error) {
        logger.error('Error fetching pending mergers:', error);
        res.status(500).json({ error: 'Failed to fetch pending mergers' });
    }
});

/**
 * GET /api/mergers/marketplace
 * Get marketplace mergers
 */
router.get('/marketplace', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const mergers = await storyMergerService.getMarketplaceMergers(limit);
        res.json(mergers);
    } catch (error) {
        logger.error('Error fetching marketplace mergers:', error);
        res.status(500).json({ error: 'Failed to fetch marketplace mergers' });
    }
});

/**
 * GET /api/mergers/:id
 * Get merger by ID
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const merger = await storyMergerService.getMergerById(id);
        res.json(merger);
    } catch (error: any) {
        logger.error('Error fetching merger:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message || 'Failed to fetch merger',
        });
    }
});

/**
 * POST /api/mergers/:id/purchase
 * Purchase merger access
 */
router.post('/:id/purchase', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const result = await storyMergerService.purchaseMerger(id, userId);
        res.json(result);
    } catch (error: any) {
        logger.error('Error purchasing merger:', error);
        res.status(500).json({
            error: error.message || 'Failed to purchase merger',
        });
    }
});

/**
 * GET /api/mergers/:id/conflicts
 * Detect conflicts in merger narratives
 */
router.get('/:id/conflicts', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const conflicts = await storyMergerService.detectConflicts(id);
        res.json({ conflicts });
    } catch (error: any) {
        logger.error('Error detecting conflicts:', error);
        res.status(500).json({
            error: error.message || 'Failed to detect conflicts',
        });
    }
});

/**
 * POST /api/mergers/:id/conflicts/:conflictId/resolve
 * Resolve a specific conflict
 */
router.post('/:id/conflicts/:conflictId/resolve', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id, conflictId } = req.params;
        const { strategy, selectedValue, votes } = req.body;

        if (!strategy) {
            return res.status(400).json({
                error: 'Missing required field: strategy',
            });
        }

        const result = await storyMergerService.resolveConflict(id, conflictId, {
            strategy,
            selectedValue,
            votes,
        });

        res.json(result);
    } catch (error: any) {
        logger.error('Error resolving conflict:', error);
        res.status(500).json({
            error: error.message || 'Failed to resolve conflict',
        });
    }
});

export default router;
