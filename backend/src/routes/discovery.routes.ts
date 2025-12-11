import { Router, Request, Response } from 'express';
import { discoveryService } from '../services/discovery.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/discover/creators
 * Get creators for discovery feed
 */
router.get('/creators', async (req: Request, res: Response) => {
    try {
        const {
            tab = 'for-you',
            category,
            interests,
            lifeStage,
            page = '1',
            limit = '10',
        } = req.query;

        // Parse interests from comma-separated string
        const interestsArray = interests
            ? (interests as string).split(',').filter(Boolean)
            : undefined;

        const params = {
            tab: tab as 'for-you' | 'trending' | 'new' | 'category',
            category: category as string | undefined,
            interests: interestsArray,
            lifeStage: lifeStage as string | undefined,
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
            userId: (req as any).user?.id, // Optional: for authenticated users
        };

        const result = await discoveryService.getDiscoveryCreators(params);
        res.json(result);
    } catch (error) {
        console.error('Error fetching discovery creators:', error);
        res.status(500).json({ error: 'Failed to fetch creators' });
    }
});

/**
 * GET /api/discover/search
 * Search creators by query
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q, page = '1', limit = '10' } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const result = await discoveryService.searchCreators(
            q,
            parseInt(page as string, 10),
            parseInt(limit as string, 10)
        );

        res.json(result);
    } catch (error) {
        console.error('Error searching creators:', error);
        res.status(500).json({ error: 'Failed to search creators' });
    }
});

/**
 * GET /api/discover/creators/:id
 * Get detailed creator profile
 */
router.get('/creators/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const creator = await discoveryService.getCreatorProfile(id);
        res.json(creator);
    } catch (error) {
        console.error('Error fetching creator profile:', error);

        if ((error as Error).message === 'Creator not found') {
            return res.status(404).json({ error: 'Creator not found' });
        }

        res.status(500).json({ error: 'Failed to fetch creator profile' });
    }
});

/**
 * POST /api/discover/creators/:id/subscribe
 * Subscribe to a creator (requires authentication)
 */
router.post('/creators/:id/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id: creatorId } = req.params;
        const { tierId } = req.body;
        const userId = req.user!.id;

        if (!tierId) {
            return res.status(400).json({ error: 'Tier ID is required' });
        }

        // TODO: Implement subscription creation
        // This should integrate with your existing subscription service
        res.json({
            message: 'Subscription endpoint - to be implemented',
            creatorId,
            tierId,
            userId,
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

export default router;
