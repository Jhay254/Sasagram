import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as shadowSelfController from '../controllers/shadow-self.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Shadow Self report management
router.post('/generate', shadowSelfController.generateReport);
router.get('/reports', shadowSelfController.getReports);
router.get('/reports/:id', shadowSelfController.getReportById);
router.delete('/reports/:id', shadowSelfController.deleteReport);

// Preview and deleted content
router.get('/preview', shadowSelfController.getPreview);
router.get('/deleted-content', shadowSelfController.getDeletedContent);

export default router;
