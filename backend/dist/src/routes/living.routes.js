"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const living_feed_service_1 = require("../services/engagement/living-feed.service");
const chapter_ai_service_1 = require("../services/ai/chapter-ai.service");
const scheduler_service_1 = require("../services/engagement/scheduler.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
// ==========================================
// LIVING FEED ROUTES
// ==========================================
/**
 * GET /api/living/feed
 * Get aggregated living feed
 */
router.get('/feed', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const feed = await living_feed_service_1.livingFeedService.getFeed(userId, page, limit);
        res.json(feed);
    }
    catch (error) {
        logger_1.default.error('Error fetching living feed:', error);
        res.status(500).json({ error: 'Failed to fetch living feed' });
    }
});
/**
 * POST /api/living/feed
 * Create a new feed entry
 */
router.post('/feed', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, mood, location, mediaUrls, isPublic } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const entry = await living_feed_service_1.livingFeedService.createEntry(userId, {
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
        res.status(500).json({ error: error.message || 'Failed to create feed entry' });
    }
});
/**
 * GET /api/living/chapters/:id/feed
 * Get feed for a specific chapter
 */
router.get('/chapters/:id/feed', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const feed = await living_feed_service_1.livingFeedService.getChapterFeed(id);
        res.json(feed);
    }
    catch (error) {
        logger_1.default.error('Error fetching chapter feed:', error);
        res.status(500).json({ error: 'Failed to fetch chapter feed' });
    }
});
// ==========================================
// AI & SCHEDULER ROUTES
// ==========================================
/**
 * POST /api/living/ai/detect-completion
 * Check for chapter completion signals
 */
router.post('/ai/detect-completion', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const signal = await chapter_ai_service_1.chapterAIService.detectCompletion(userId);
        res.json({ signal });
    }
    catch (error) {
        logger_1.default.error('Error detecting completion:', error);
        res.status(500).json({ error: 'Failed to detect completion' });
    }
});
/**
 * POST /api/living/chapters/:id/schedule
 * Schedule episodic release
 */
router.post('/chapters/:id/schedule', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { frequency, day, time } = req.body;
        if (!frequency) {
            return res.status(400).json({ error: 'Frequency is required' });
        }
        const result = await scheduler_service_1.schedulerService.scheduleRelease(id, {
            frequency,
            day,
            time,
        });
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error scheduling release:', error);
        res.status(500).json({ error: 'Failed to schedule release' });
    }
});
exports.default = router;
