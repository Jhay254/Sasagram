import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Get creator snapshot
 */
export async function getCreatorSnapshot(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const snapshot = await AnalyticsService.getCreatorSnapshot(userId);

        res.json({
            success: true,
            data: snapshot,
        });
    } catch (error: any) {
        console.error('Error getting snapshot:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get subscriber growth
 */
export async function getSubscriberGrowth(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { days = 30 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const growth = await AnalyticsService.getSubscriberGrowth(userId, Number(days));

        res.json({
            success: true,
            data: growth,
        });
    } catch (error: any) {
        console.error('Error getting growth:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get content performance
 */
export async function getContentPerformance(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { limit = 10 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const performance = await AnalyticsService.getContentPerformance(userId, Number(limit));

        res.json({
            success: true,
            data: performance,
        });
    } catch (error: any) {
        console.error('Error getting performance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { days = 30 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const revenue = await AnalyticsService.getRevenueAnalytics(userId, Number(days));

        res.json({
            success: true,
            data: revenue,
        });
    } catch (error: any) {
        console.error('Error getting revenue:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get audience demographics
 */
export async function getAudienceDemographics(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const demographics = await AnalyticsService.getAudienceDemographics(userId);

        res.json({
            success: true,
            data: demographics,
        });
    } catch (error: any) {
        console.error('Error getting demographics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get engagement metrics
 */
export async function getEngagementMetrics(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { days = 30 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const metrics = await AnalyticsService.getEngagementMetrics(userId, Number(days));

        res.json({
            success: true,
            data: metrics,
        });
    } catch (error: any) {
        console.error('Error getting metrics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
