"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tagging_service_1 = require("../services/network/tagging.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * POST /api/tags
 * Tag a user in an event
 */
router.post('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const taggerId = req.user.id;
        const { taggedUserEmail, eventId, eventTitle, eventDate, message } = req.body;
        if (!taggedUserEmail || !eventId || !eventTitle || !eventDate) {
            return res.status(400).json({
                error: 'Missing required fields: taggedUserEmail, eventId, eventTitle, eventDate',
            });
        }
        const tag = await tagging_service_1.taggingService.tagUser(taggerId, taggedUserEmail, {
            eventId,
            eventTitle,
            eventDate: new Date(eventDate),
            message,
        });
        res.json(tag);
    }
    catch (error) {
        logger_1.default.error('Error creating tag:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});
/**
 * GET /api/tags/pending
 * Get pending tags for current user
 */
router.get('/pending', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const tags = await tagging_service_1.taggingService.getPendingTags(userId);
        res.json(tags);
    }
    catch (error) {
        logger_1.default.error('Error fetching pending tags:', error);
        res.status(500).json({ error: 'Failed to fetch pending tags' });
    }
});
/**
 * GET /api/tags/my-tags
 * Get all tags for current user (made and received)
 */
router.get('/my-tags', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const tags = await tagging_service_1.taggingService.getUserTags(userId);
        res.json(tags);
    }
    catch (error) {
        logger_1.default.error('Error fetching user tags:', error);
        res.status(500).json({ error: 'Failed to fetch user tags' });
    }
});
/**
 * POST /api/tags/:tagId/verify
 * Verify/accept a tag
 */
router.post('/:tagId/verify', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { tagId } = req.params;
        const { perspective, photos, details } = req.body;
        if (!perspective) {
            return res.status(400).json({
                error: 'Missing required field: perspective',
            });
        }
        const tag = await tagging_service_1.taggingService.verifyTag(tagId, userId, {
            perspective,
            photos,
            details,
        });
        res.json(tag);
    }
    catch (error) {
        logger_1.default.error('Error verifying tag:', error);
        res.status(error.message.includes('unauthorized') ? 403 : 500).json({
            error: error.message || 'Failed to verify tag',
        });
    }
});
/**
 * POST /api/tags/:tagId/decline
 * Decline a tag
 */
router.post('/:tagId/decline', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { tagId } = req.params;
        const tag = await tagging_service_1.taggingService.declineTag(tagId, userId);
        res.json(tag);
    }
    catch (error) {
        logger_1.default.error('Error declining tag:', error);
        res.status(error.message.includes('unauthorized') ? 403 : 500).json({
            error: error.message || 'Failed to decline tag',
        });
    }
});
exports.default = router;
