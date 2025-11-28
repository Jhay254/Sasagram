import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as taggingController from '../controllers/tagging.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a tag
router.post('/tags', taggingController.createTag);

// Get pending tags for current user
router.get('/tags/pending', taggingController.getPendingTags);

// Verify a tag
router.post('/tags/:tagId/verify', taggingController.verifyTag);

// Decline a tag
router.post('/tags/:tagId/decline', taggingController.declineTag);

// Add perspective to a tag
router.post('/tags/:tagId/perspective', taggingController.addPerspective);

// Get tags for a specific event
router.get('/events/:eventId/tags', taggingController.getEventTags);

// Get memory completeness score
router.get('/completeness', taggingController.getMemoryCompleteness);

// Get leaderboard
router.get('/leaderboard', taggingController.getLeaderboard);

// Get verification stats
router.get('/stats', taggingController.getVerificationStats);

export default router;
