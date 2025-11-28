import { Request, Response } from 'express';
import { PatternPrivacyService } from '../services/pattern-privacy.service';

/**
 * Get privacy settings
 * GET /api/patterns/privacy
 */
export const getPrivacySettings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const settings = await PatternPrivacyService.getPrivacySettings(userId);

        res.json(settings);
    } catch (error: any) {
        console.error('Error getting privacy settings:', error);
        res.status(500).json({ error: error.message || 'Failed to get settings' });
    }
};

/**
 * Update privacy settings
 * PUT /api/patterns/privacy
 */
export const updatePrivacySettings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const updates = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const settings = await PatternPrivacyService.updatePrivacySettings(userId, updates);

        res.json({
            success: true,
            settings,
        });
    } catch (error: any) {
        console.error('Error updating privacy settings:', error);
        res.status(500).json({ error: error.message || 'Failed to update settings' });
    }
};

/**
 * Accept prediction disclaimer
 * POST /api/patterns/privacy/accept-disclaimer
 */
export const acceptDisclaimer = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const settings = await PatternPrivacyService.acceptPredictionDisclaimer(userId);

        res.json({
            success: true,
            message: 'Disclaimer accepted',
            settings,
        });
    } catch (error: any) {
        console.error('Error accepting disclaimer:', error);
        res.status(500).json({ error: error.message || 'Failed to accept disclaimer' });
    }
};
