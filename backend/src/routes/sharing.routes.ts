import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as sharingController from '../controllers/sharing.controller';

const router = Router();

// Public routes - for Open Graph crawlers
router.get('/metadata/biography/:biographyId', sharingController.getBiographyMetadata);
router.get('/metadata/profile/:userId', sharingController.getProfileMetadata);
router.get('/urls/:type/:id', sharingController.generateShareUrls);

// Protected routes
router.use(authenticate);

router.post('/track', sharingController.trackShare);

export default router;
