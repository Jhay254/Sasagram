import { Request, Response } from 'express';
import { ScreenshotDetectionService } from '../services/screenshot-detection.service';

/**
 * Report screenshot attempt
 * POST /api/security/screenshot-attempt
 */
export const reportScreenshot = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { reportId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const deviceInfo = {
            deviceId: req.headers['x-device-id'] || 'unknown',
            deviceType: req.headers['x-device-type'] || 'unknown',
            ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
            userAgent: req.headers['user-agent'] || '',
        };

        const violation = await ScreenshotDetectionService.logScreenshotAttempt(
            userId,
            reportId,
            deviceInfo
        );

        res.json({
            success: true,
            violation,
            message: 'Screenshot attempt logged. This is a serious violation of the NDA.',
            warning: 'Your account may be suspended after multiple violations.',
        });
    } catch (error: any) {
        console.error('Error reporting screenshot:', error);
        res.status(500).json({ error: error.message || 'Failed to report screenshot' });
    }
};

/**
 * Get violation history
 * GET /api/security/violations
 */
export const getViolations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const violations = await ScreenshotDetectionService.getViolationHistory(userId);

        res.json({
            count: violations.length,
            violations,
        });
    } catch (error: any) {
        console.error('Error getting violations:', error);
        res.status(500).json({ error: error.message || 'Failed to get violations' });
    }
};

/**
 * Acknowledge violation
 * POST /api/security/violations/:id/acknowledge
 */
export const acknowledgeViolation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;
        const { explanation } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await ScreenshotDetectionService.acknowledgeViolation(id, userId, explanation);

        res.json({
            success: true,
            message: 'Violation acknowledged',
        });
    } catch (error: any) {
        console.error('Error acknowledging violation:', error);
        res.status(500).json({ error: error.message || 'Failed to acknowledge violation' });
    }
};

/**
 * Check suspension status
 * GET /api/security/suspension-status
 */
export const getSuspensionStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const isSuspended = await ScreenshotDetectionService.isSuspended(userId);

        res.json({
            isSuspended,
        });
    } catch (error: any) {
        console.error('Error checking suspension:', error);
        res.status(500).json({ error: error.message || 'Failed to check suspension' });
    }
};
