import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as mergerController from '../controllers/merger.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Merged chapter management
router.post('/create', mergerController.createMergedChapter);
router.get('/', mergerController.getMergedChapters);
router.put('/:id', mergerController.updateMergedChapter);
router.delete('/:id', mergerController.requestDeletion);

// Edit locking
router.post('/:id/lock', mergerController.lockChapter);
router.post('/:id/unlock', mergerController.unlockChapter);

// Revenue
router.get('/:id/revenue', mergerController.getRevenueDistribution);

export default router;
