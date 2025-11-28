import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as trustBadgeController from '../controllers/trust-badge.controller';

const router = Router();

// Get user's badges (public, no auth for viewing)
router.get('/:userId', trustBadgeController.getUserBadges);

// Get badge criteria (public)
router.get('/criteria', trustBadgeController.getBadgeCriteria);

// Get user's progress (authenticated)
router.get('/progress', authenticate, trustBadgeController.getBadgeProgress);

// Calculate and award badges (authenticated)
router.post('/calculate', authenticate, trustBadgeController.calculateBadges);

export default router;
