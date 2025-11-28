import { Router } from 'express';
import { HistoricalArchiveController } from '../controllers/historical-archive.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/public/search', HistoricalArchiveController.searchPublicArchives);

// Authenticated routes
router.use(authMiddleware);

// Create archive
router.post('/', HistoricalArchiveController.createArchive);

// Get user's archives
router.get('/user', HistoricalArchiveController.getUserArchives);

// Get archive items
router.get('/:archiveId/items', HistoricalArchiveController.getArchiveItems);

// Request access to public archive
router.post('/:archiveId/access/request', HistoricalArchiveController.requestAccess);

// Check feature status
router.get('/feature-status', HistoricalArchiveController.checkFeatureStatus);

export default router;
