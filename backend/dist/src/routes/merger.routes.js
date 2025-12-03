"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const story_merger_service_1 = require("../services/network/story-merger.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * POST /api/mergers
 * Create merger proposal
 */
router.post('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { collisionId } = req.body;
        if (!collisionId) {
            return res.status(400).json({
                error: 'Missing required field: collisionId',
            });
        }
        const merger = await story_merger_service_1.storyMergerService.createMergerProposal(collisionId, userId);
        res.json(merger);
    }
    catch (error) {
        logger_1.default.error('Error creating merger:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message || 'Failed to create merger',
        });
    }
});
/**
 * POST /api/mergers/:id/approve
 * Approve merger and add perspective
 */
router.post('/:id/approve', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { narrative, photos, mood } = req.body;
        if (!narrative) {
            return res.status(400).json({
                error: 'Missing required field: narrative',
            });
        }
        const merger = await story_merger_service_1.storyMergerService.approveMerger(id, userId, {
            narrative,
            photos,
            mood,
        });
        res.json(merger);
    }
    catch (error) {
        logger_1.default.error('Error approving merger:', error);
        res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
            error: error.message || 'Failed to approve merger',
        });
    }
});
/**
 * POST /api/mergers/:id/publish
 * Publish merger
 */
router.post('/:id/publish', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;
        const merger = await story_merger_service_1.storyMergerService.publishMerger(id, price);
        res.json(merger);
    }
    catch (error) {
        logger_1.default.error('Error publishing merger:', error);
        res.status(500).json({
            error: error.message || 'Failed to publish merger',
        });
    }
});
/**
 * GET /api/mergers/my-mergers
 * Get user's mergers
 */
router.get('/my-mergers', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const mergers = await story_merger_service_1.storyMergerService.getUserMergers(userId);
        res.json(mergers);
    }
    catch (error) {
        logger_1.default.error('Error fetching mergers:', error);
        res.status(500).json({ error: 'Failed to fetch mergers' });
    }
});
/**
 * GET /api/mergers/pending
 * Get pending merger proposals for user
 */
router.get('/pending', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const mergers = await story_merger_service_1.storyMergerService.getPendingMergers(userId);
        res.json(mergers);
    }
    catch (error) {
        logger_1.default.error('Error fetching pending mergers:', error);
        res.status(500).json({ error: 'Failed to fetch pending mergers' });
    }
});
/**
 * GET /api/mergers/marketplace
 * Get marketplace mergers
 */
router.get('/marketplace', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const mergers = await story_merger_service_1.storyMergerService.getMarketplaceMergers(limit);
        res.json(mergers);
    }
    catch (error) {
        logger_1.default.error('Error fetching marketplace mergers:', error);
        res.status(500).json({ error: 'Failed to fetch marketplace mergers' });
    }
});
/**
 * GET /api/mergers/:id
 * Get merger by ID
 */
router.get('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const merger = await story_merger_service_1.storyMergerService.getMergerById(id);
        res.json(merger);
    }
    catch (error) {
        logger_1.default.error('Error fetching merger:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message || 'Failed to fetch merger',
        });
    }
});
/**
 * POST /api/mergers/:id/purchase
 * Purchase merger access
 */
router.post('/:id/purchase', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await story_merger_service_1.storyMergerService.purchaseMerger(id, userId);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error purchasing merger:', error);
        res.status(500).json({
            error: error.message || 'Failed to purchase merger',
        });
    }
});
/**
 * GET /api/mergers/:id/conflicts
 * Detect conflicts in merger narratives
 */
router.get('/:id/conflicts', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const conflicts = await story_merger_service_1.storyMergerService.detectConflicts(id);
        res.json({ conflicts });
    }
    catch (error) {
        logger_1.default.error('Error detecting conflicts:', error);
        res.status(500).json({
            error: error.message || 'Failed to detect conflicts',
        });
    }
});
/**
 * POST /api/mergers/:id/conflicts/:conflictId/resolve
 * Resolve a specific conflict
 */
router.post('/:id/conflicts/:conflictId/resolve', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id, conflictId } = req.params;
        const { strategy, selectedValue, votes } = req.body;
        if (!strategy) {
            return res.status(400).json({
                error: 'Missing required field: strategy',
            });
        }
        const result = await story_merger_service_1.storyMergerService.resolveConflict(id, conflictId, {
            strategy,
            selectedValue,
            votes,
        });
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error resolving conflict:', error);
        res.status(500).json({
            error: error.message || 'Failed to resolve conflict',
        });
    }
});
exports.default = router;
