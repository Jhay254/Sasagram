"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkController = exports.NetworkController = void 0;
const connection_service_1 = require("../services/network/connection.service");
const collision_service_1 = require("../services/network/collision.service");
const logger_1 = __importDefault(require("../utils/logger"));
class NetworkController {
    /**
     * GET /api/network/graph
     * Get user's memory graph
     */
    async getMemoryGraph(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const graph = await connection_service_1.connectionService.getMemoryGraph(userId);
            res.json({
                success: true,
                data: graph
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching memory graph:', error);
            res.status(500).json({ error: 'Failed to fetch memory graph' });
        }
    }
    /**
     * GET /api/network/connections/:userId
     * Get relationship timeline with another user
     */
    async getRelationshipTimeline(req, res) {
        try {
            const currentUserId = req.user?.id;
            const { userId } = req.params;
            if (!currentUserId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const timeline = await connection_service_1.connectionService.getRelationshipTimeline(currentUserId, userId);
            res.json({
                success: true,
                data: timeline
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching relationship timeline:', error);
            res.status(500).json({ error: 'Failed to fetch relationship timeline' });
        }
    }
    /**
     * POST /api/network/connections
     * Create or update connection with another user
     */
    async createConnection(req, res) {
        try {
            const currentUserId = req.user?.id;
            const { userId, relationshipType } = req.body;
            if (!currentUserId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }
            const connection = await connection_service_1.connectionService.createOrUpdateConnection(currentUserId, userId, relationshipType);
            res.json({
                success: true,
                data: connection
            });
        }
        catch (error) {
            logger_1.default.error('Error creating connection:', error);
            res.status(500).json({ error: 'Failed to create connection' });
        }
    }
    /**
     * GET /api/network/collisions/:userId
     * Detect memory overlaps with another user
     */
    async detectCollisions(req, res) {
        try {
            const currentUserId = req.user?.id;
            const { userId } = req.params;
            if (!currentUserId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const overlaps = await collision_service_1.collisionService.detectOverlaps(currentUserId, userId);
            res.json({
                success: true,
                data: overlaps
            });
        }
        catch (error) {
            logger_1.default.error('Error detecting collisions:', error);
            res.status(500).json({ error: 'Failed to detect collisions' });
        }
    }
}
exports.NetworkController = NetworkController;
exports.networkController = new NetworkController();
