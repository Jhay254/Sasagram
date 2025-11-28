import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as engagementController from '../controllers/engagement.controller';

const router = Router();

// Public routes
router.get('/biographies/:biographyId/reviews', engagementController.getReviews);
router.get('/chapters/:chapterId/reactions', engagementController.getChapterReactions);

// Protected routes
router.use(authenticate);

// Bookmarks
router.post('/bookmarks', engagementController.addBookmark);
router.delete('/bookmarks/:biographyId', engagementController.removeBookmark);
router.get('/bookmarks', engagementController.getBookmarks);

// Reading progress
router.post('/progress', engagementController.updateProgress);
router.get('/progress/:biographyId', engagementController.getProgress);

// Reviews
router.post('/reviews', engagementController.createReview);

// Reactions
router.post('/reactions', engagementController.addReaction);
router.delete('/reactions/:chapterId', engagementController.removeReaction);

export default router;
