"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rewind_service_1 = require("../services/engagement/rewind.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * GET /api/rewind/feed
 * Get main rewind feed
 */
router.get('/feed', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const cursor = req.query.cursor;
        const limit = parseInt(req.query.limit) || 10;
        const feed = await rewind_service_1.rewindService.getRewindFeed(userId, cursor, limit);
        res.json(feed);
    }
    catch (error) {
        logger_1.default.error('Error fetching rewind feed:', error);
        res.status(500).json({ error: 'Failed to fetch rewind feed' });
    }
});
/**
 * GET /api/rewind/on-this-day
 * Get content from this day in previous years
 */
router.get('/on-this-day', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const dateStr = req.query.date;
        const date = dateStr ? new Date(dateStr) : new Date();
        const memories = await rewind_service_1.rewindService.getMemoryComparison(userId, date);
        res.json(memories);
    }
    catch (error) {
        logger_1.default.error('Error fetching On This Day memories:', error);
        res.status(500).json({ error: 'Failed to fetch memories' });
    }
});
/**
 * GET /api/rewind/random
 * Get a random memory
 */
router.get('/random', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const memory = await rewind_service_1.rewindService.getRandomMemory(userId);
        res.json(memory);
    }
    catch (error) {
        logger_1.default.error('Error fetching random memory:', error);
        res.status(500).json({ error: 'Failed to fetch random memory' });
    }
});
/**
 * GET /api/rewind/timeline
 * Get timeline for a specific year
 */
router.get('/timeline', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const timeline = await rewind_service_1.rewindService.getTimeline(userId, year);
        res.json(timeline);
    }
    catch (error) {
        logger_1.default.error('Error fetching timeline:', error);
        res.status(500).json({ error: 'Failed to fetch timeline' });
    }
});
/**
 * GET /api/rewind/map
 * Get all memories with location data
 */
router.get('/map', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const locations = await rewind_service_1.rewindService.getMemoryLocations(userId);
        res.json(locations);
    }
    catch (error) {
        logger_1.default.error('Error fetching memory locations:', error);
        res.status(500).json({ error: 'Failed to fetch memory locations' });
    }
});
exports.default = router;
