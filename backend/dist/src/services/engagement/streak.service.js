"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streakService = exports.StreakService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
class StreakService {
    /**
     * Record a daily open for the user
     */
    async recordDailyOpen(userId) {
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
        }
        catch (error) {
            logger_1.default.error('Error recording daily open:', error);
            throw error;
        }
    }
    /**
     * Calculate current streak for user
     */
    async getStreak(userId) {
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
            if (activities.length === 0)
                return 0;
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
                }
                else if (diffDays > streak) {
                    break;
                }
            }
            return streak;
        }
        catch (error) {
            logger_1.default.error('Error calculating streak:', error);
            throw error;
        }
    }
    /**
     * Get streak leaderboard
     */
    async getStreakLeaderboard(limit = 10) {
        try {
            // This is a simplified version - in production you'd want to cache this
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                },
            });
            const leaderboard = await Promise.all(users.map(async (user) => ({
                userId: user.id,
                name: user.name,
                streak: await this.getStreak(user.id),
            })));
            return leaderboard
                .sort((a, b) => b.streak - a.streak)
                .slice(0, limit);
        }
        catch (error) {
            logger_1.default.error('Error fetching streak leaderboard:', error);
            throw error;
        }
    }
}
exports.StreakService = StreakService;
exports.streakService = new StreakService();
