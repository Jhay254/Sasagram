import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class AnalyticsService {
    /**
     * Track Rewind usage
     */
    async trackRewindUsage(userId: string, action: string, metadata?: any): Promise<void> {
        try {
            await prisma.userActivity.create({
                data: {
                    userId,
                    activityType: `rewind_${action}`,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                    timestamp: new Date(),
                },
            });
        } catch (error) {
            logger.error('Error tracking Rewind usage:', error);
            // Don't throw - analytics shouldn't break the app
        }
    }

    /**
     * Get Rewind analytics for a user
     */
    async getRewindAnalytics(userId: string): Promise<any> {
        try {
            const activities = await prisma.userActivity.findMany({
                where: {
                    userId,
                    activityType: {
                        startsWith: 'rewind_',
                    },
                },
                orderBy: {
                    timestamp: 'desc',
                },
                take: 100,
            });

            // Aggregate by action type
            const actionCounts: Record<string, number> = {};
            const yearExplored: Set<number> = new Set();

            activities.forEach(activity => {
                const action = activity.activityType.replace('rewind_', '');
                actionCounts[action] = (actionCounts[action] || 0) + 1;

                if (activity.metadata) {
                    try {
                        const meta = JSON.parse(activity.metadata);
                        if (meta.year) yearExplored.add(meta.year);
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            });

            return {
                totalActions: activities.length,
                actionBreakdown: actionCounts,
                yearsExplored: Array.from(yearExplored).sort((a, b) => b - a),
                lastActivity: activities[0]?.timestamp,
            };
        } catch (error) {
            logger.error('Error fetching Rewind analytics:', error);
            throw error;
        }
    }

    /**
     * Get global trends
     */
    async getGlobalTrends(): Promise<any> {
        try {
            const recentActivities = await prisma.userActivity.findMany({
                where: {
                    activityType: {
                        startsWith: 'rewind_',
                    },
                    timestamp: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    },
                },
            });

            const yearCounts: Record<number, number> = {};

            recentActivities.forEach(activity => {
                if (activity.metadata) {
                    try {
                        const meta = JSON.parse(activity.metadata);
                        if (meta.year) {
                            yearCounts[meta.year] = (yearCounts[meta.year] || 0) + 1;
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            });

            const topYears = Object.entries(yearCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([year, count]) => ({ year: parseInt(year), views: count }));

            return {
                totalUsers: await prisma.user.count(),
                activeLastWeek: new Set(recentActivities.map(a => a.userId)).size,
                topYears,
            };
        } catch (error) {
            logger.error('Error fetching global trends:', error);
            throw error;
        }
    }
}

export const analyticsService = new AnalyticsService();
