"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gamification_service_1 = require("../services/gamification/gamification.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * GET /api/gamification/achievements
 * Get user's achievements (unlocked and locked)
 */
router.get('/achievements', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        // Get all available achievements
        const allAchievements = await gamification_service_1.gamificationService.getAllAchievements();
        // Get user's unlocked achievements
        const userAchievements = await gamification_service_1.gamificationService.getUserAchievements(userId);
        const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
        // Merge data
        const result = allAchievements.map(achievement => ({
            ...achievement,
            unlocked: unlockedIds.has(achievement.id),
            unlockedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt || null,
        }));
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error fetching achievements:', error);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});
/**
 * GET /api/gamification/leaderboard
 * Get top users
 */
router.get('/leaderboard', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const leaderboard = await gamification_service_1.gamificationService.getLeaderboard();
        res.json(leaderboard);
    }
    catch (error) {
        logger_1.default.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});
exports.default = router;
