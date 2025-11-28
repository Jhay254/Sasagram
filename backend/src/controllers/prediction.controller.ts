import { Request, Response } from 'express';
import { PredictionEngineService } from '../services/prediction-engine.service';
import { FeatureFlagService } from '../services/feature-flag.service';

export class Prediction EngineController {
  /**
   * Generate predictions for user
   */
  static async generatePredictions(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            const predictions = await PredictionEngineService.generatePredictions(userId);

            res.json({
                success: true,
                predictions,
                count: predictions.length,
            });
        } catch (error: any) {
            if (error.message === 'Prediction feature not available') {
                return res.status(403).json({
                    success: false,
                    error: 'Feature not available',
                    comingSoon: true,
                });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

  /**
   * Get user's predictions
   */
  static async getUserPredictions(req: Request, res: Response) {
        try {
            const userId = req.params.userId || req.user!.id;
            const viewerId = req.user?.id;

            const predictions = await PredictionEngineService.getUserPredictions(userId, viewerId);

            res.json({
                success: true,
                predictions,
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

  /**
   * Record actual outcome (for accuracy tracking)
   */
  static async recordOutcome(req: Request, res: Response) {
        try {
            const { predictionId } = req.params;
            const { didOccur, actualDate } = req.body;

            await PredictionEngineService.recordActualOutcome(
                predictionId,
                didOccur,
                actualDate ? new Date(actualDate) : undefined
            );

            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

  /**
   * Get model accuracy stats
   */
  static async getModelAccuracy(req: Request, res: Response) {
        try {
            const { modelName } = req.params;

            const accuracy = await PredictionEngineService.getModelAccuracy(modelName);

            res.json({ success: true, accuracy });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

  /**
   * Check if prediction feature is enabled for user
   */
  static async checkFeatureEnabled(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            const isEnabled = await FeatureFlagService.isEnabled('FEATURE_PREDICTIONS', userId);

            res.json({
                success: true,
                enabled: isEnabled,
                featureName: 'FEATURE_PREDICTIONS',
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
