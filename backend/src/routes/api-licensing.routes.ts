import { Router } from 'express';
import { APILicensingController } from '../controllers/api-licensing.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/products', APILicensingController.getAPIProducts);

// Authenticated routes
router.use(authMiddleware);

// Create API key
router.post('/keys', APILicensingController.createAPIKey);

// Get user's API keys
router.get('/keys', APILicensingController.getUserAPIKeys);

// Get usage stats
router.get('/keys/:apiKeyId/stats', APILicensingController.getUsageStats);

// Revoke API key
router.delete('/keys/:apiKeyId', APILicensingController.revokeAPIKey);

// Check feature status
router.get('/feature-status', APILicensingController.checkFeatureStatus);

export default router;
