import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class StreakService {
    /**
     * Record a daily open for the user
     */
    async recordDailyOpen(userId: string): Promise<{ streak: number; isNewDay: boolean }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            // Check if user already opened today
            const existingOpen = await prisma.userActivity.findFirst({
                where: {
                    userId,
                    activityType: 'daily_open',
                    timestamp: {
                        gte: today,
                    },
                },
            });

            if (existingOpen) {
                const streak = await this.getStreak(userId);
                return { streak, isNewDay: false };
            }

            // Record the open
            await prisma.userActivity.create({
                data: {
                    userId,
                    activityType: 'daily_open',
                    timestamp: new Date(),
                },
            });

            const streak = await this.getStreak(userId);
            return { streak, isNewDay: true };
        } catch (error) {
            logger.error('Error recording daily open:', error);
            throw error;
        }
    }

    /**
     * Calculate current streak for user
     */
    async getStreak(userId: string): Promise<number> {
        try {
            const activities = await prisma.userActivity.findMany({
                where: {
                    userId,
                    activityType: 'daily_open',
                },
                orderBy: {
                    timestamp: 'desc',
                },
            });

            if (activities.length === 0) return 0;

            let streak = 0;
            let currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            for (const activity of activities) {
                const activityDate = new Date(activity.timestamp);
                activityDate.setHours(0, 0, 0, 0);

                const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === streak) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else if (diffDays > streak) {
                    break;
                }
            }

            return streak;
        } catch (error) {
            logger.error('Error calculating streak:', error);
            throw error;
        }
    }

    /**
     * Get streak leaderboard
     */
    async getStreakLeaderboard(limit: number = 10): Promise<any[]> {
        try {
            // This is a simplified version - in production you'd want to cache this
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                },
            });

            const leaderboard = await Promise.all(
                users.map(async (user) => ({
                    userId: user.id,
                    name: user.name,
                    streak: await this.getStreak(user.id),
                }))
            );

            return leaderboard
                .sort((a, b) => b.streak - a.streak)
                .slice(0, limit);
        } catch (error) {
            logger.error('Error fetching streak leaderboard:', error);
            throw error;
        }
    }
}

export const streakService = new StreakService();
