import { Request, Response } from 'express';
import { APILicensingService } from '../services/api-licensing.service';
import { FeatureFlagService } from '../services/feature-flag.service';

export class APILicensingController {
    /**
     * Create API key
     */
    static async createAPIKey(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { name, scopes, tier } = req.body;

            const apiKey = await APILicensingService.createAPIKey(userId, {
                name,
                scopes,
                tier,
            });

            res.json({ success: true, apiKey });
        } catch (error: any) {
            if (error.message === 'API Licensing feature not available') {
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
     * Get user's API keys
     */
    static async getUserAPIKeys(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            const apiKeys = await APILicensingService.getUserAPIKeys(userId);

            res.json({ success: true, apiKeys });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get usage stats for API key
     */
    static async getUsageStats(req: Request, res: Response) {
        try {
            const { apiKeyId } = req.params;
            const { period } = req.query;

            const stats = await APILicensingService.getUsageStats(
                apiKeyId,
                (period as 'day' | 'month' | 'all') || 'month'
            );

            res.json({ success: true, stats });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Revoke API key
     */
    static async revokeAPIKey(req: Request, res: Response) {
        try {
            const { apiKeyId } = req.params;
            const { reason } = req.body;

            await APILicensingService.revokeAPIKey(apiKeyId, reason);

            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get available API products
     */
    static async getAPIProducts(req: Request, res: Response) {
        try {
            const products = await APILicensingService.getAPIProducts();

            res.json({ success: true, products });
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
            const isEnabled = await FeatureFlagService.isEnabled('FEATURE_API_LICENSING', userId);

            res.json({
                success: true,
                enabled: isEnabled,
                featureName: 'FEATURE_API_LICENSING',
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
