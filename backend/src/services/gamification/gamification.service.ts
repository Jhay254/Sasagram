import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class GamificationService {
    /**
     * Check and unlock achievements based on a trigger
     */
    async checkAchievements(userId: string, triggerType: string, value: number = 1): Promise<string[]> {
        try {
            // 1. Get potential achievements for this trigger
            const potentialAchievements = await prisma.achievement.findMany({
                where: { triggerType },
            });

            if (potentialAchievements.length === 0) return [];

            // 2. Get user's current progress/stats (simplified for MVP)
            // In a real app, we'd query a stats table. Here we'll calculate on the fly or use the passed value.
            let currentStat = value;

            // If trigger is 'post_count', count user's posts
            if (triggerType === 'post_count') {
                currentStat = await prisma.livingFeedEntry.count({ where: { userId } });
            } else if (triggerType === 'referral_count') {
                const referralCode = await prisma.referralCode.findUnique({ where: { userId } });
                currentStat = referralCode ? referralCode.usageCount : 0;
            }

            const unlockedIds: string[] = [];

            // 3. Check each achievement
            for (const achievement of potentialAchievements) {
                if (currentStat >= achievement.threshold) {
                    // Check if already unlocked
                    const existing = await prisma.userAchievement.findUnique({
                        where: {
                            userId_achievementId: {
                                userId,
                                achievementId: achievement.id,
                            },
                        },
                    });

                    if (!existing) {
                        await this.unlockAchievement(userId, achievement.id);
                        unlockedIds.push(achievement.id);
                    }
                }
            }

            return unlockedIds;
        } catch (error) {
            logger.error('Error checking achievements:', error);
            return [];
        }
    }

    /**
     * Unlock a specific achievement for a user
     */
    async unlockAchievement(userId: string, achievementId: string): Promise<void> {
        try {
            await prisma.userAchievement.create({
                data: {
                    userId,
                    achievementId,
                },
            });
            logger.info(`Achievement unlocked for user ${userId}: ${achievementId}`);
        } catch (error) {
            // Ignore unique constraint violations (already unlocked)
            if ((error as any).code !== 'P2002') {
                logger.error('Error unlocking achievement:', error);
            }
        }
    }

    /**
     * Get user's achievements
     */
    async getUserAchievements(userId: string) {
        return prisma.userAchievement.findMany({
            where: { userId },
            include: { achievement: true },
            orderBy: { unlockedAt: 'desc' },
        });
    }

    /**
     * Get all available achievements
     */
    async getAllAchievements() {
        return prisma.achievement.findMany({
            orderBy: { points: 'asc' },
        });
    }

    /**
     * Get leaderboard (top users by achievement points)
     * Note: This is a heavy query, should be cached in production
     */
    async getLeaderboard(limit: number = 10) {
        // 1. Group user achievements and sum points
        // Prisma doesn't support deep relation aggregation easily in groupBy
        // So we'll fetch users and their achievements

        // Optimization: Use raw query for performance in production
        const users = await prisma.user.findMany({
            include: {
                achievements: {
                    include: { achievement: true }
                }
            },
            take: 100, // Fetch top 100 candidates to sort in memory
        });

        const leaderboard = users.map(user => {
            const totalPoints = user.achievements.reduce((sum, ua) => sum + ua.achievement.points, 0);
            return {
                userId: user.id,
                name: user.name || 'Anonymous',
                avatar: null, // Add avatar logic if needed
                points: totalPoints,
                badgeCount: user.achievements.length,
            };
        });

        return leaderboard
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }
}

export const gamificationService = new GamificationService();
