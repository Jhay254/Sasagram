import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as followController from '../controllers/follow.controller';

const router = Router();

// Public routes
router.get('/users/:userId/profile', followController.getPublicProfile);
router.get('/users/:userId/followers', followController.getFollowers);
router.get('/users/:userId/following', followController.getFollowing);

// Protected routes
router.use(authenticate);

// Follow/unfollow
router.post('/users/:userId/follow', followController.followUser);
router.post('/users/:userId/unfollow', followController.unfollowUser);

// Check following status
router.get('/users/:userId/is-following', followController.checkFollowing);

// Profile analytics (own profile only)
router.get('/analytics', followController.getProfileAnalytics);

// Mutual followers
router.get('/mutual-followers', followController.getMutualFollowers);

export default router;
