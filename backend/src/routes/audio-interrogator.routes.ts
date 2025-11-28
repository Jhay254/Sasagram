import { Router } from 'express';
import { AudioInterrogatorController } from '../controllers/audio-interrogator.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Start interrogation session
router.post('/session', AudioInterrogatorController.startSession);

// Get session details
router.get('/session/:sessionId', AudioInterrogatorController.getSession);

// Submit audio response (with file upload)
router.post(
    '/question/:questionId/respond',
    AudioInterrogatorController.uploadMiddleware,
    AudioInterrogatorController.submitAudioResponse
);

// Get user's audio diary entries
router.get('/diary', AudioInterrogatorController.getDiaryEntries);

// Check feature status
router.get('/feature-status', AudioInterrogatorController.checkFeatureStatus);

export default router;
