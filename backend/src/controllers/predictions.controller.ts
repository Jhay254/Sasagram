import { Request, Response } from 'express';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';

/**
 * Get user predictions
 * GET /api/predictions
 */
export const getPredictions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const includeExpired = req.query.includeExpired === 'true';

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const predictions = await PredictiveAnalyticsService.getUserPredictions(userId, includeExpired);

        res.json({
            count: predictions.length,
            predictions,
        });
    } catch (error: any) {
        console.error('Error getting predictions:', error);
        res.status(500).json({ error: error.message || 'Failed to get predictions' });
    }
};

/**
 * Get specific prediction
 * GET /api/predictions/:id
 */
export const getPredictionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        const predictions = await PredictiveAnalyticsService.getUserPredictions(userId, true);
        const found = predictions.find(p => p.id === id);

        if (!found) {
            return res.status(404).json({ error: 'Prediction not found' });
        }

        res.json(found);
    } catch (error: any) {
        console.error('Error getting prediction:', error);
        res.status(500).json({ error: error.message || 'Failed to get prediction' });
    }
};

/**
 * Generate new predictions
 * POST /api/predictions/generate
 */
export const generatePredictions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const predictions = await PredictiveAnalyticsService.generatePredictions(userId);

        res.json({
            success: true,
            message: `Generated ${predictions.length} predictions`,
            predictions,
        });
    } catch (error: any) {
        console.error('Error generating predictions:', error);

        if (error.message.includes('disclaimer')) {
            return res.status(403).json({ error: error.message });
        }

        res.status(500).json({ error: error.message || 'Failed to generate predictions' });
    }
};

/**
 * Provide feedback on prediction accuracy
 * POST /api/predictions/feedback
 */
export const provideFeedback = async (req: Request, res: Response) => {
    try {
        const { predictionId, outcome, actualDate, userFeedback } = req.body;

        if (!predictionId || !outcome) {
            return res.status(400).json({ error: 'predictionId and outcome are required' });
        }

        if (!['ACCURATE', 'INACCURATE', 'PARTIALLY_ACCURATE'].includes(outcome)) {
            return res.status(400).json({ error: 'Invalid outcome value' });
        }

        await PredictiveAnalyticsService.updatePredictionAccuracy(
            predictionId,
            outcome,
            actualDate ? new Date(actualDate) : undefined,
            userFeedback
        );

        res.json({
            success: true,
            message: 'Feedback recorded',
        });
    } catch (error: any) {
        console.error('Error providing feedback:', error);
        res.status(500).json({ error: error.message || 'Failed to provide feedback' });
    }
};

/**
 * Get prediction accuracy stats
 * GET /api/predictions/accuracy
 */
export const getAccuracyStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const stats = await PredictiveAnalyticsService.getPredictionAccuracy(userId);

        res.json(stats);
    } catch (error: any) {
        console.error('Error getting accuracy stats:', error);
        res.status(500).json({ error: error.message || 'Failed to get accuracy stats' });
    }
};
