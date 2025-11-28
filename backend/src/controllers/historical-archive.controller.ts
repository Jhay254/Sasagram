import { Request, Response } from 'express';
import { HistoricalArchiveService } from '../services/historical-archive.service';
import { FeatureFlagService } from '../services/feature-flag.service';

export class HistoricalArchiveController {
    /**
     * Create archive
     */
    static async createArchive(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { name, description, timePeriod, category, isPublic } = req.body;

            const archive = await HistoricalArchiveService.createArchive(userId, {
                name,
                description,
                timePeriod,
                category,
                isPublic,
            });

            res.json({ success: true, archive });
        } catch (error: any) {
            if (error.message === 'Historical Archive feature not available') {
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
     * Get user's archives
     */
    static async getUserArchives(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            const archives = await HistoricalArchiveService.getUserArchives(userId);

            res.json({ success: true, archives });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get archive items
     */
    static async getArchiveItems(req: Request, res: Response) {
        try {
            const { archiveId } = req.params;
            const { itemType, dateFrom, dateTo, search } = req.query;

            const items = await HistoricalArchiveService.getArchiveItems(archiveId, {
                itemType: itemType as string,
                dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
                dateTo: dateTo ? new Date(dateTo as string) : undefined,
                search: search as string,
            });

            res.json({ success: true, items });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Request archive access
     */
    static async requestAccess(req: Request, res: Response) {
        try {
            const { archiveId } = req.params;
            const requestData = req.body;

            const accessRequest = await HistoricalArchiveService.requestArchiveAccess(
                archiveId,
                requestData
            );

            res.json({ success: true, accessRequest });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Search public archives
     */
    static async searchPublicArchives(req: Request, res: Response) {
        try {
            const { category, timePeriod, search } = req.query;

            const archives = await HistoricalArchiveService.searchPublicArchives({
                category: category as string,
                timePeriod: timePeriod as string,
                search: search as string,
            });

            res.json({ success: true, archives });
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
            const isEnabled = await FeatureFlagService.isEnabled('FEATURE_HISTORICAL_ARCHIVE', userId);

            res.json({
                success: true,
                enabled: isEnabled,
                featureName: 'FEATURE_HISTORICAL_ARCHIVE',
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
