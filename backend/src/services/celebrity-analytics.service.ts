import prisma from '../db/prisma';

/**
 * Celebrity Analytics Service - Simplified MVP for Career Tracking
 * Features: Performance metrics, social media stats, revenue tracking
 */
export class CelebrityAnalyticsService {
    /**
     * Track career metric
     */
    static async trackMetric(celebrityId: string, data: {
        metricType: string;
        metricName: string;
        value: number;
        unit?: string;
        period: string;
        date: Date;
        metadata?: any;
    }) {
        const metric = await prisma.careerAnalytics.create({
            data: {
                celebrityId,
                ...data,
            },
        });

        return metric;
    }

    /**
     * Get career dashboard overview
     */
    static async getDashboardOverview(celebrityId: string) {
        const profile = await prisma.celebrityProfile.findUnique({
            where: { id: celebrityId },
        });

        // Get recent analytics (last 30 days)
        const recentMetrics = await prisma.careerAnalytics.findMany({
            where: {
                celebrityId,
                date: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            },
            orderBy: { date: 'desc' },
        });

        // Get media mentions count
        const mentionsCount = await prisma.mediaMention.count({
            where: { celebrityId },
        });

        // Get NFT collection stats
        const nftCollection = await prisma.nFTCollection.findUnique({
            where: { celebrityId },
        });

        return {
            profile,
            metrics: {
                total: recentMetrics.length,
                byType: this.groupMetricsByType(recentMetrics),
            },
            mediaMentions: mentionsCount,
            nftStats: {
                totalMinted: nftCollection?.totalMinted || 0,
                totalVolume: nftCollection?.totalVolume || 0,
                floorPrice: nftCollection?.floorPrice,
            },
        };
    }

    /**
     * Get performance trends
     */
    static async getPerformanceTrends(celebrityId: string, metricType: string, days: number = 90) {
        const metrics = await prisma.careerAnalytics.findMany({
            where: {
                celebrityId,
                metricType,
                date: {
                    gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                },
            },
            orderBy: { date: 'asc' },
        });

        return metrics;
    }

    // ========== Private Helper Methods ==========

    private static groupMetricsByType(metrics: any[]) {
        return metrics.reduce((acc, metric) => {
            if (!acc[metric.metricType]) {
                acc[metric.metricType] = [];
            }
            acc[metric.metricType].push(metric);
            return acc;
        }, {} as Record<string, any[]>);
    }
}
