import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as rewindController from '../controllers/rewind.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Day snapshots and timeline
router.get('/day/:date', rewindController.getDaySnapshot);
router.get('/timeline', rewindController.getTimeline);

// On This Day and Random Memory
router.get('/on-this-day', rewindController.getOnThisDay);
router.get('/random-memory', rewindController.getRandomMemory);

// Comparison mode
router.post('/comparison', rewindController.generateComparison);

// Preferences
router.get('/preferences', rewindController.getPreferences);
router.put('/preferences', rewindController.updatePreferences);

export default router;
