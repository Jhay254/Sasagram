import { Router } from 'express';
import { BeforeIDieController } from '../controllers/before-i-die.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Setup dead man's switch
router.post('/switch/setup', BeforeIDieController.setupSwitch);

// User check-in
router.post('/switch/checkin', BeforeIDieController.checkIn);

// Schedule posthumous content
router.post('/content', BeforeIDieController.scheduleContent);

// Get posthumous content
router.get('/content', BeforeIDieController.getContent);

// Verify death (trustee)
router.post('/verify/:verificationId', BeforeIDieController.verifyDeath);

// Check feature status
router.get('/feature-status', BeforeIDieController.checkFeatureStatus);

export default router;
