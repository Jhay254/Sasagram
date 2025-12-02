"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const collision_detection_service_1 = require("../services/network/collision-detection.service");
const connection_service_1 = require("../services/network/connection.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * POST /api/network/detect-collisions
 * Trigger collision detection for current user
 */
router.post('/detect-collisions', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        await collision_detection_service_1.collisionDetectionService.detectAllCollisions(userId);
        res.json({
            success: true,
            message: 'Collision detection completed',
        });
    }
    catch (error) {
        logger_1.default.error('Error detecting collisions:', error);
        res.status(500).json({ error: 'Failed to detect collisions' });
    }
});
/**
 * GET /api/network/memory-graph
 * Get user's memory graph
 */
router.get('/memory-graph', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const graph = await connection_service_1.connectionService.getMemoryGraph(userId);
        res.json(graph);
    }
    catch (error) {
        logger_1.default.error('Error fetching memory graph:', error);
        res.status(500).json({ error: 'Failed to fetch memory graph' });
    }
});
/**
 * GET /api/network/relationship/:userId
 * Get relationship timeline with another user
 */
router.get('/relationship/:userId', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;
        const timeline = await connection_service_1.connectionService.getRelationshipTimeline(currentUserId, otherUserId);
        res.json(timeline);
    }
    catch (error) {
        logger_1.default.error('Error fetching relationship timeline:', error);
        res.status(500).json({ error: 'Failed to fetch relationship timeline' });
    }
});
/**
 * POST /api/network/connection
 * Manually create/strengthen connection
 */
router.post('/connection', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId, relationshipType } = req.body;
        const connection = await connection_service_1.connectionService.createOrUpdateConnection(userId, otherUserId, relationshipType);
        res.json(connection);
    }
    catch (error) {
        logger_1.default.error('Error creating connection:', error);
        res.status(500).json({ error: 'Failed to create connection' });
    }
});
/**
 * GET /api/network/collisions
 * Get detected collisions for user
 */
router.get('/collisions', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const allCollisions = await prisma.memoryCollision.findMany({
            orderBy: { timestamp: 'desc' },
        });
        // Filter collisions that include this user
        const userCollisions = allCollisions.filter(c => {
            const users = JSON.parse(c.users);
            return users.includes(userId);
        });
        res.json(userCollisions);
    }
    catch (error) {
        logger_1.default.error('Error fetching collisions:', error);
        res.status(500).json({ error: 'Failed to fetch collisions' });
    }
});
exports.default = router;
