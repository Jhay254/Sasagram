import { Request, Response } from 'express';
import { ShadowSelfService } from '../services/shadow-self.service';
import { DeletedContentService } from '../services/deleted-content.service';

/**
 * Generate Shadow Self report
 * POST /api/shadow-self/generate
 */
export const generateReport = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { reportPeriod } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const report = await ShadowSelfService.generateReport(userId, reportPeriod || 'All Time');

        res.json({
            success: true,
            report,
            message: 'Shadow Self report generated successfully',
        });
    } catch (error: any) {
        console.error('Error generating Shadow Self report:', error);

        if (error.message.includes('subscription') || error.message.includes('NDA')) {
            return res.status(403).json({ error: error.message });
        }

        res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
};

/**
 * Get user's Shadow Self reports
 * GET /api/shadow-self/reports
 */
export const getReports = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const reports = await ShadowSelfService.getUserReports(userId);

        res.json({
            count: reports.length,
            reports,
        });
    } catch (error: any) {
        console.error('Error getting reports:', error);
        res.status(500).json({ error: error.message || 'Failed to get reports' });
    }
};

/**
 * Get specific Shadow Self report
 * GET /api/shadow-self/reports/:id
 */
export const getReportById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get device info from request
        const deviceInfo = {
            deviceId: req.headers['x-device-id'] || 'unknown',
            deviceType: req.headers['x-device-type'] || 'web',
            deviceModel: req.headers['x-device-model'],
            ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
            userAgent: req.headers['user-agent'] || '',
            biometricUsed: req.headers['x-biometric-auth'] === 'true',
        };

        const report = await ShadowSelfService.getReport(id, userId, deviceInfo);

        res.json(report);
    } catch (error: any) {
        console.error('Error getting report:', error);
        res.status(500).json({ error: error.message || 'Failed to get report' });
    }
};

/**
 * Delete Shadow Self report
 * DELETE /api/shadow-self/reports/:id
 */
export const deleteReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await ShadowSelfService.deleteReport(id, userId);

        res.json({
            success: true,
            message: 'Report deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting report:', error);
        res.status(500).json({ error: error.message || 'Failed to delete report' });
    }
};

/**
 * Get preview of what will be in Shadow Self report
 * GET /api/shadow-self/preview
 */
export const getPreview = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const deletedContent = await DeletedContentService.getUserDeletedContent(userId);
        const patterns = await DeletedContentService.analyzeDeletionPatterns(userId);
        const comparison = await DeletedContentService.comparePublicPrivate(userId);

        res.json({
            deletedItemCount: deletedContent.length,
            themes: patterns.themeBreakdown,
            emotions: patterns.emotionalBreakdown,
            publicPrivateGap: comparison.publicPrivateGap,
            canGenerate: deletedContent.length > 0,
        });
    } catch (error: any) {
        console.error('Error getting preview:', error);
        res.status(500).json({ error: error.message || 'Failed to get preview' });
    }
};

/**
 * Get deleted content items
 * GET /api/shadow-self/deleted-content
 */
export const getDeletedContent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const deletedContent = await DeletedContentService.getUserDeletedContent(userId);

        res.json({
            count: deletedContent.length,
            items: deletedContent,
        });
    } catch (error: any) {
        console.error('Error getting deleted content:', error);
        res.status(500).json({ error: error.message || 'Failed to get deleted content' });
    }
};
