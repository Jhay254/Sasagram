import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as securityController from '../controllers/security.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Security violation reporting
router.post('/screenshot-attempt', securityController.reportScreenshot);
router.get('/violations', securityController.getViolations);
router.post('/violations/:id/acknowledge', securityController.acknowledgeViolation);
router.get('/suspension-status', securityController.getSuspensionStatus);

export default router;
