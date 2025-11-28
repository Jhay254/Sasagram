import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as locationController from '../controllers/location.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Save location
router.post('/', locationController.saveLocation);

// Get history
router.get('/history', locationController.getLocationHistory);

// Privacy settings
router.get('/privacy', locationController.getLocationPrivacy);
router.put('/privacy', locationController.updateLocationPrivacy);

// Nearby memories (geofencing)
router.get('/nearby', locationController.checkNearbyMemories);

// Delete history
router.delete('/history', locationController.deleteLocationHistory);

export default router;
