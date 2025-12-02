"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chapter_service_1 = require("../services/engagement/chapter.service");
const feed_service_1 = require("../services/engagement/feed.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
// ==========================================
// CHAPTER ROUTES
// ==========================================
/**
 * POST /api/engagement/chapters
 * Create/Start a new chapter
 */
router.post('/chapters', auth_middleware_1.authenticate, async (req, res) => {
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
router.post('/chapters/:id/complete', auth_middleware_1.authenticate, async (req, res) => {
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
// ==========================================
// FEED ROUTES
// ==========================================
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
exports.default = router;
