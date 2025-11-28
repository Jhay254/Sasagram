import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as discoveryController from '../controllers/discovery.controller';

const router = Router();

// Public routes
router.get('/trending', discoveryController.getTrending);
router.get('/categories', discoveryController.getCategories);
router.get('/categories/:category', discoveryController.getBiographiesByCategory);
router.get('/featured-creators', discoveryController.getFeaturedCreators);
router.get('/search', discoveryController.searchBiographies);

// Protected routes
router.use(authenticate);

// Personalized feed
router.get('/feed', discoveryController.getPersonalizedFeed);

// Track activity
router.post('/activity', discoveryController.trackActivity);

export default router;
