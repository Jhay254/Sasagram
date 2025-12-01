import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { collisionDetectionService } from '../services/network/collision-detection.service';
import { connectionService } from '../services/network/connection.service';
import { authenticateToken } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/network/detect-collisions
 * Trigger collision detection for current user
 */
router.post('/detect-collisions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;

        await collisionDetectionService.detectAllCollisions(userId);

        res.json({
            success: true,
            message: 'Collision detection completed',
        });
    } catch (error) {
        logger.error('Error detecting collisions:', error);
        res.status(500).json({ error: 'Failed to detect collisions' });
    }
});

/**
 * GET /api/network/memory-graph
 * Get user's memory graph
 */
router.get('/memory-graph', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;

        const graph = await connectionService.getMemoryGraph(userId);

        res.json(graph);
    } catch (error) {
        logger.error('Error fetching memory graph:', error);
        res.status(500).json({ error: 'Failed to fetch memory graph' });
    }
});

/**
 * GET /api/network/relationship/:userId
 * Get relationship timeline with another user
 */
router.get('/relationship/:userId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user!.userId;
        const otherUserId = req.params.userId;

        const timeline = await connectionService.getRelationshipTimeline(
            currentUserId,
            otherUserId
        );

        res.json(timeline);
    } catch (error) {
        logger.error('Error fetching relationship timeline:', error);
        res.status(500).json({ error: 'Failed to fetch relationship timeline' });
    }
});

/**
 * POST /api/network/connection
 * Manually create/strengthen connection
 */
router.post('/connection', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const { otherUserId, relationshipType } = req.body;

        const connection = await connectionService.createOrUpdateConnection(
            userId,
            otherUserId,
            relationshipType
        );

        res.json(connection);
    } catch (error) {
        logger.error('Error creating connection:', error);
        res.status(500).json({ error: 'Failed to create connection' });
    }
});

/**
 * GET /api/network/collisions
 * Get detected collisions for user
 */
router.get('/collisions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;

        const allCollisions = await prisma.memoryCollision.findMany({
            orderBy: { timestamp: 'desc' },
        });

        // Filter collisions that include this user
        const userCollisions = allCollisions.filter(c => {
            const users = JSON.parse(c.users);
            return users.includes(userId);
        });

        res.json(userCollisions);
    } catch (error) {
        logger.error('Error fetching collisions:', error);
        res.status(500).json({ error: 'Failed to fetch collisions' });
    }
});

export default router;
