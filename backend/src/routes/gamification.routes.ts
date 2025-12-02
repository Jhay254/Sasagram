import { Router } from 'express';
import { gamificationService } from '../services/gamification/gamification.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/gamification/achievements
 * Get user's achievements (unlocked and locked)
 */
router.get('/achievements', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;

        // Get all available achievements
        const allAchievements = await gamificationService.getAllAchievements();

        // Get user's unlocked achievements
        const userAchievements = await gamificationService.getUserAchievements(userId);
        const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

        // Merge data
        const result = allAchievements.map(achievement => ({
            ...achievement,
            unlocked: unlockedIds.has(achievement.id),
            unlockedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt || null,
        }));

        res.json(result);
    } catch (error) {
        logger.error('Error fetching achievements:', error);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});

/**
 * GET /api/gamification/leaderboard
 * Get top users
 */
router.get('/leaderboard', authenticate, async (req: AuthRequest, res) => {
    try {
        const leaderboard = await gamificationService.getLeaderboard();
        res.json(leaderboard);
    } catch (error) {
        logger.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

export default router;
