import { Router } from 'express';
import { creatorController } from '../controllers/creator.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/creators/onboarding
 * Upgrade user to creator role
 */
router.post('/onboarding', authenticate, creatorController.onboard);

export default router;
