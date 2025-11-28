import { Request, Response } from 'express';
import { BeforeIDieService } from '../services/before-i-die.service';
import { FeatureFlagService } from '../services/feature-flag.service';

export class BeforeIDieController {
    /**
     * Setup dead man's switch
     */
    static async setupSwitch(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { checkInFrequency, trusteeEmail, trusteeName, gracePeriodDays } = req.body;

            const dms = await BeforeIDieService.setupDeadMansSwitch(userId, {
                checkInFrequency,
                trusteeEmail,
                trusteeName,
                gracePeriodDays,
            });

            res.json({ success: true, switch: dms });
        } catch (error: any) {
            if (error.message === 'Before I Die feature not available') {
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
     * User check-in
     */
    static async checkIn(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            const result = await BeforeIDieService.checkIn(userId);

            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Schedule posthumous content
     */
    static async scheduleContent(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const contentData = req.body;

            const content = await BeforeIDieService.schedulePosthumousContent(userId, contentData);

            res.json({ success: true, content });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get user's posthumous content
     */
    static async getContent(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            const content = await BeforeIDieService.getUserPosthumousContent(userId);

            res.json({ success: true, content });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Verify death (trustee endpoint)
     */
    static async verifyDeath(req: Request, res: Response) {
        try {
            const { verificationId } = req.params;
            const { documentUrl } = req.body;

            const verification = await BeforeIDieService.verifyDeath(verificationId, documentUrl);

            res.json({ success: true, verification });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Check feature status
     */
    static async checkFeatureStatus(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const isEnabled = await FeatureFlagService.isEnabled('FEATURE_BEFORE_I_DIE', userId);

            res.json({
                success: true,
                enabled: isEnabled,
                featureName: 'FEATURE_BEFORE_I_DIE',
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
