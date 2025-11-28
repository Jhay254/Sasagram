import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as watermarkController from '../controllers/watermark.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply watermark
router.post('/apply', watermarkController.upload.single('image'), watermarkController.applyWatermark);

// Verify watermark
router.post('/verify', watermarkController.verifyWatermark);

// Report leaked content
router.post('/report-leak', watermarkController.reportLeak);

// Extract forensic watermark
router.post('/extract', watermarkController.upload.single('image'), watermarkController.extractForensicWatermark);

export default router;
