import { Router } from 'express';
import { PredictionEngineController } from '../controllers/prediction.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Generate predictions for current user
router.post('/generate', PredictionEngineController.generatePredictions);

// Get predictions
router.get('/user/:userId?', PredictionEngineController.getUserPredictions);

// Record actual outcome (for accuracy)
router.post('/:predictionId/outcome', PredictionEngineController.recordOutcome);

// Model accuracy
router.get('/model/:modelName/accuracy', PredictionEngineController.getModelAccuracy);

// Check if feature is enabled
router.get('/feature-status', PredictionEngineController.checkFeatureEnabled);

export default router;
