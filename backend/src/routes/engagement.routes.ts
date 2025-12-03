import { Router } from 'express';
import { chapterService } from '../services/engagement/chapter.service';
import { feedService } from '../services/engagement/feed.service';
import { streakService } from '../services/engagement/streak.service';
import { notificationService } from '../services/engagement/notification.service';
import { analyticsService } from '../services/engagement/analytics.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

// ==========================================
// CHAPTER ROUTES
// ==========================================

/**
 * POST /api/engagement/chapters
 * Create/Start a new chapter
 */
router.post('/chapters', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { title, content, startDate, endDate } = req.body;

        if (!title || !startDate) {
            return res.status(400).json({ error: 'Missing required fields: title, startDate' });
        }

        const chapter = await chapterService.createChapter(userId, {
            title,
            content,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
        });

        res.json(chapter);
    } catch (error) {
        logger.error('Error creating chapter:', error);
        res.status(500).json({ error: 'Failed to create chapter' });
    }
});

/**
 * POST /api/engagement/chapters/:id/complete
 * Complete a chapter
 */
router.post('/chapters/:id/complete', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { trigger } = req.body;

        const chapter = await chapterService.completeChapter(id, trigger);
        res.json(chapter);
    } catch (error) {
        logger.error('Error completing chapter:', error);
        res.status(500).json({ error: 'Failed to complete chapter' });
    }
});

/**
 * GET /api/engagement/chapters/active
 * Get active chapter for current user
 */
router.get('/chapters/active', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const chapter = await chapterService.getActiveChapter(userId);
        res.json(chapter || null);
    } catch (error) {
        logger.error('Error fetching active chapter:', error);
        res.status(500).json({ error: 'Failed to fetch active chapter' });
    }
});

/**
 * GET /api/engagement/chapters
 * Get all chapters for current user
 */
router.get('/chapters', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const chapters = await chapterService.getUserChapters(userId);
        res.json(chapters);
    } catch (error) {
        logger.error('Error fetching chapters:', error);
        res.status(500).json({ error: 'Failed to fetch chapters' });
    }
});

/**
 * GET /api/engagement/chapters/:id/analytics
 * Get analytics for a specific chapter
 */
router.get('/chapters/:id/analytics', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const analytics = await chapterService.getChapterAnalytics(id);
        res.json(analytics);
    } catch (error) {
        logger.error('Error fetching chapter analytics:', error);
        res.status(500).json({ error: 'Failed to fetch chapter analytics' });
    }
});

// ==========================================
// FEED ROUTES
// ==========================================

/**
 * POST /api/engagement/feed
 * Create a new feed entry
 */
router.post('/feed', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { content, mood, location, mediaUrls, isPublic } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const entry = await feedService.createEntry(userId, {
            content,
            mood,
            location,
            mediaUrls,
            isPublic,
        });

        res.json(entry);
    } catch (error) {
        logger.error('Error creating feed entry:', error);
        res.status(500).json({ error: 'Failed to create feed entry' });
    }
});

/**
 * GET /api/engagement/feed
 * Get aggregated feed
 */
router.get('/feed', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const feed = await feedService.getFeed(userId, page, limit);
        res.json(feed);
    } catch (error) {
        logger.error('Error fetching feed:', error);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

// ==========================================
// PERMISSION ROUTES
// ==========================================

/**
 * POST /api/engagement/chapters/:id/permissions
 * Grant permission to a user
 */
router.post('/chapters/:id/permissions', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;
        const { targetUserId, role } = req.body;

        if (!targetUserId || !role) {
            return res.status(400).json({ error: 'Missing required fields: targetUserId, role' });
        }

        const { permissionService } = await import('../services/engagement/permission.service');
        const result = await permissionService.grantPermission(id, targetUserId, role, userId);

        res.json(result);
    } catch (error: any) {
        logger.error('Error granting permission:', error);
        res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
            error: error.message || 'Failed to grant permission',
        });
    }
});

/**
 * DELETE /api/engagement/chapters/:id/permissions/:userId
 * Revoke permission from a user
 */
router.delete('/chapters/:id/permissions/:userId', authenticate, async (req: AuthRequest, res) => {
    try {
        const currentUserId = req.user!.id;
        const { id, userId } = req.params;

        const { permissionService } = await import('../services/engagement/permission.service');
        const result = await permissionService.revokePermission(id, userId, currentUserId);

        res.json(result);
    } catch (error: any) {
        logger.error('Error revoking permission:', error);
        res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
            error: error.message || 'Failed to revoke permission',
        });
    }
});

// ==========================================
// VERSION ROUTES
// ==========================================

/**
 * GET /api/engagement/chapters/:id/versions
 * Get version history
 */
router.get('/chapters/:id/versions', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const { versionService } = await import('../services/engagement/version.service');
        const versions = await versionService.getVersionHistory(id);

        res.json({ versions });
    } catch (error: any) {
        logger.error('Error fetching versions:', error);
        res.status(500).json({
            error: error.message || 'Failed to fetch versions',
        });
    }
});

/**
 * POST /api/engagement/chapters/:id/versions/:versionId/revert
 * Revert to a specific version
 */
router.post('/chapters/:id/versions/:versionId/revert', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { id, versionId } = req.params;

        const { versionService } = await import('../services/engagement/version.service');
        const result = await versionService.revertToVersion(id, versionId, userId);

        res.json(result);
    } catch (error: any) {
        logger.error('Error reverting version:', error);
        res.status(500).json({
            error: error.message || 'Failed to revert version',
        });
    }
});

// ==========================================
// STREAK ROUTES
// ==========================================

/**
 * POST /api/engagement/streak/record
 * Record daily open
 */
router.post('/streak/record', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const result = await streakService.recordDailyOpen(userId);
        res.json(result);
    } catch (error) {
        logger.error('Error recording daily open:', error);
        res.status(500).json({ error: 'Failed to record daily open' });
    }
});

/**
 * GET /api/engagement/streak
 * Get current streak
 */
router.get('/streak', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const streak = await streakService.getStreak(userId);
        res.json({ streak });
    } catch (error) {
        logger.error('Error fetching streak:', error);
        res.status(500).json({ error: 'Failed to fetch streak' });
    }
});

/**
 * GET /api/engagement/streak/leaderboard
 * Get streak leaderboard
 */
router.get('/streak/leaderboard', authenticate, async (req: AuthRequest, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const leaderboard = await streakService.getStreakLeaderboard(limit);
        res.json(leaderboard);
    } catch (error) {
        logger.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// ==========================================
// NOTIFICATION ROUTES
// ==========================================

/**
 * GET /api/engagement/notifications
 * Get user notifications
 */
router.get('/notifications', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 20;
        const notifications = await notificationService.getUserNotifications(userId, limit);
        res.json(notifications);
    } catch (error) {
        logger.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/**
 * POST /api/engagement/notifications/:id/track
 * Track notification engagement
 */
router.post('/notifications/:id/track', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const notificationId = req.params.id;
        const { action } = req.body;

        await notificationService.trackNotificationEngagement(userId, notificationId, action);
        res.json({ success: true });
    } catch (error) {
        logger.error('Error tracking notification:', error);
        res.status(500).json({ error: 'Failed to track notification' });
    }
});

// ==========================================
// ANALYTICS ROUTES
// ==========================================

/**
 * POST /api/engagement/analytics/track
 * Track user action
 */
router.post('/analytics/track', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { action, metadata } = req.body;

        await analyticsService.trackRewindUsage(userId, action, metadata);
        res.json({ success: true });
    } catch (error) {
        logger.error('Error tracking analytics:', error);
        res.status(500).json({ error: 'Failed to track analytics' });
    }
});

/**
 * GET /api/engagement/analytics/rewind
 * Get Rewind analytics
 */
router.get('/analytics/rewind', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const analytics = await analyticsService.getRewindAnalytics(userId);
        res.json(analytics);
    } catch (error) {
        logger.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

/**
 * GET /api/engagement/analytics/trends
 * Get global trends
 */
router.get('/analytics/trends', authenticate, async (req: AuthRequest, res) => {
    try {
        const trends = await analyticsService.getGlobalTrends();
        res.json(trends);
    } catch (error) {
        logger.error('Error fetching trends:', error);
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
});

export default router;
