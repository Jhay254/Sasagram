"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chapter_service_1 = require("../services/engagement/chapter.service");
const feed_service_1 = require("../services/engagement/feed.service");
const streak_service_1 = require("../services/engagement/streak.service");
const notification_service_1 = require("../services/engagement/notification.service");
const analytics_service_1 = require("../services/engagement/analytics.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const engagement_validator_1 = require("../validators/engagement.validator");
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// ==========================================
// CHAPTER ROUTES
// ==========================================
/**
 * POST /api/engagement/chapters
 * Create/Start a new chapter
 */
router.post('/chapters', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(engagement_validator_1.createChapterSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, content, startDate, endDate } = req.body;
        if (!title || !startDate) {
            return res.status(400).json({ error: 'Missing required fields: title, startDate' });
        }
        const chapter = await chapter_service_1.chapterService.createChapter(userId, {
            title,
            content,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
        });
        res.json(chapter);
    }
    catch (error) {
        logger_1.default.error('Error creating chapter:', error);
        res.status(500).json({ error: 'Failed to create chapter' });
    }
});
/**
 * POST /api/engagement/chapters/:id/complete
 * Complete a chapter
 */
router.post('/chapters/:id/complete', auth_middleware_1.authenticate, (0, authorization_middleware_1.authorizeOwnership)('chapter'), async (req, res) => {
    try {
        const { id } = req.params;
        const { trigger } = req.body;
        const chapter = await chapter_service_1.chapterService.completeChapter(id, trigger);
        res.json(chapter);
    }
    catch (error) {
        logger_1.default.error('Error completing chapter:', error);
        res.status(500).json({ error: 'Failed to complete chapter' });
    }
});
/**
 * GET /api/engagement/chapters/active
 * Get active chapter for current user
 */
router.get('/chapters/active', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const chapter = await chapter_service_1.chapterService.getActiveChapter(userId);
        res.json(chapter || null);
    }
    catch (error) {
        logger_1.default.error('Error fetching active chapter:', error);
        res.status(500).json({ error: 'Failed to fetch active chapter' });
    }
});
/**
 * GET /api/engagement/chapters
 * Get all chapters for current user
 */
router.get('/chapters', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const chapters = await chapter_service_1.chapterService.getUserChapters(userId);
        res.json(chapters);
    }
    catch (error) {
        logger_1.default.error('Error fetching chapters:', error);
        res.status(500).json({ error: 'Failed to fetch chapters' });
    }
});
/**
 * GET /api/engagement/chapters/:id/analytics
 * Get analytics for a specific chapter
 */
router.get('/chapters/:id/analytics', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const analytics = await chapter_service_1.chapterService.getChapterAnalytics(id);
        res.json(analytics);
    }
    catch (error) {
        logger_1.default.error('Error fetching chapter analytics:', error);
        res.status(500).json({ error: 'Failed to fetch chapter analytics' });
    }
});
// ==========================================
// FEED ROUTES
/**
 * POST /api/engagement/feed
 * Create a new feed entry
 */
router.post('/feed', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, mood, location, mediaUrls, isPublic } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const entry = await feed_service_1.feedService.createEntry(userId, {
            content,
            mood,
            location,
            mediaUrls,
            isPublic,
        });
        res.json(entry);
    }
    catch (error) {
        logger_1.default.error('Error creating feed entry:', error);
        res.status(500).json({ error: 'Failed to create feed entry' });
    }
});
/**
 * GET /api/engagement/feed
 * Get aggregated feed
 */
router.get('/feed', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const feed = await feed_service_1.feedService.getFeed(userId, page, limit);
        res.json(feed);
    }
    catch (error) {
        logger_1.default.error('Error fetching feed:', error);
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
router.post('/chapters/:id/permissions', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(engagement_validator_1.addPermissionSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { targetUserId, role } = req.body;
        if (!targetUserId || !role) {
            return res.status(400).json({ error: 'Missing required fields: targetUserId, role' });
        }
        const { permissionService } = await Promise.resolve().then(() => __importStar(require('../services/engagement/permission.service')));
        const result = await permissionService.grantPermission(id, targetUserId, role, userId);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error granting permission:', error);
        res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
            error: error.message || 'Failed to grant permission',
        });
    }
});
/**
 * DELETE /api/engagement/chapters/:id/permissions/:userId
 * Revoke permission from a user
 */
router.delete('/chapters/:id/permissions/:userId', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { id, userId } = req.params;
        const { permissionService } = await Promise.resolve().then(() => __importStar(require('../services/engagement/permission.service')));
        const result = await permissionService.revokePermission(id, userId, currentUserId);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error revoking permission:', error);
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
router.get('/chapters/:id/versions', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { versionService } = await Promise.resolve().then(() => __importStar(require('../services/engagement/version.service')));
        const versions = await versionService.getVersionHistory(id);
        res.json({ versions });
    }
    catch (error) {
        logger_1.default.error('Error fetching versions:', error);
        res.status(500).json({
            error: error.message || 'Failed to fetch versions',
        });
    }
});
/**
 * POST /api/engagement/chapters/:id/versions/:versionId/revert
 * Revert to a specific version
 */
router.post('/chapters/:id/versions/:versionId/revert', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id, versionId } = req.params;
        const { versionService } = await Promise.resolve().then(() => __importStar(require('../services/engagement/version.service')));
        const result = await versionService.revertToVersion(id, versionId, userId);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error reverting version:', error);
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
router.post('/streak/record', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await streak_service_1.streakService.recordDailyOpen(userId);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error recording daily open:', error);
        res.status(500).json({ error: 'Failed to record daily open' });
    }
});
/**
 * GET /api/engagement/streak
 * Get current streak
 */
router.get('/streak', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const streak = await streak_service_1.streakService.getStreak(userId);
        res.json({ streak });
    }
    catch (error) {
        logger_1.default.error('Error fetching streak:', error);
        res.status(500).json({ error: 'Failed to fetch streak' });
    }
});
/**
 * GET /api/engagement/streak/leaderboard
 * Get streak leaderboard
 */
router.get('/streak/leaderboard', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await streak_service_1.streakService.getStreakLeaderboard(limit);
        res.json(leaderboard);
    }
    catch (error) {
        logger_1.default.error('Error fetching leaderboard:', error);
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
router.get('/notifications', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        const notifications = await notification_service_1.notificationService.getUserNotifications(userId, limit);
        res.json(notifications);
    }
    catch (error) {
        logger_1.default.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
/**
 * POST /api/engagement/notifications/:id/track
 * Track notification engagement
 */
router.post('/notifications/:id/track', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;
        const { action } = req.body;
        await notification_service_1.notificationService.trackNotificationEngagement(userId, notificationId, action);
        res.json({ success: true });
    }
    catch (error) {
        logger_1.default.error('Error tracking notification:', error);
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
router.post('/analytics/track', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { action, metadata } = req.body;
        await analytics_service_1.analyticsService.trackRewindUsage(userId, action, metadata);
        res.json({ success: true });
    }
    catch (error) {
        logger_1.default.error('Error tracking analytics:', error);
        res.status(500).json({ error: 'Failed to track analytics' });
    }
});
/**
 * GET /api/engagement/analytics/rewind
 * Get Rewind analytics
 */
router.get('/analytics/rewind', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const analytics = await analytics_service_1.analyticsService.getRewindAnalytics(userId);
        res.json(analytics);
    }
    catch (error) {
        logger_1.default.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
/**
 * GET /api/engagement/analytics/trends
 * Get global trends
 */
router.get('/analytics/trends', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const trends = await analytics_service_1.analyticsService.getGlobalTrends();
        res.json(trends);
    }
    catch (error) {
        logger_1.default.error('Error fetching trends:', error);
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
});
exports.default = router;
