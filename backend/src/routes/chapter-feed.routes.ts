import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as chapterFeedController from '../controllers/chapter-feed.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Chapter updates
router.get('/chapters/:id/updates', chapterFeedController.getChapterUpdates);
router.get('/chapters/:id/update-count', chapterFeedController.getUpdateCount);
router.post('/chapters/:id/micro-update', chapterFeedController.createMicroUpdate);
router.post('/chapters/:id/correction', chapterFeedController.createCorrection);

// Biography feed
router.get('/biographies/:id/feed', chapterFeedController.getBiographyFeed);

// Aggregated feed
router.get('/feed/following', chapterFeedController.getFollowingFeed);

// Update management
router.delete('/updates/:id', chapterFeedController.deleteUpdate);

export default router;
