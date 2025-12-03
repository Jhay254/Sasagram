import { Router, Response } from 'express';
import { MediaService } from '../services/media.service';
import { DeduplicationService } from '../services/deduplication.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { optimizeMediaSchema, deduplicateSchema } from '../validators/media.validator';

const router = Router();
const mediaService = new MediaService();
const deduplicationService = new DeduplicationService();

// Get user media statistics
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const stats = await mediaService.getUserMediaStats(userId);
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching media stats:', error);
        res.status(500).json({ error: 'Failed to fetch media statistics' });
    }
});

// Optimize user media
router.post('/optimize', authenticate, validate(optimizeMediaSchema), async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const processed = await mediaService.processUserMedia(userId);
        res.json({ success: true, processed });
    } catch (error) {
        console.error('Error optimizing media:', error);
        res.status(500).json({ error: 'Failed to optimize media' });
    }
});

// Run deduplication
router.post('/deduplicate', authenticate, validate(deduplicateSchema), async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const result = await deduplicationService.deduplicateAll(userId);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error deduplicating:', error);
        res.status(500).json({ error: 'Failed to deduplicate data' });
    }
});

export default router;
