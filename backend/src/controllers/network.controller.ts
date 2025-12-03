import { Request, Response } from 'express';
import { connectionService } from '../services/network/connection.service';
import { collisionService } from '../services/network/collision.service';
import logger from '../utils/logger';

export class NetworkController {
    /**
     * GET /api/network/graph
     * Get user's memory graph
     */
    async getMemoryGraph(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const graph = await connectionService.getMemoryGraph(userId);

            res.json({
                success: true,
                data: graph
            });
        } catch (error) {
            logger.error('Error fetching memory graph:', error);
            res.status(500).json({ error: 'Failed to fetch memory graph' });
        }
    }

    /**
     * GET /api/network/connections/:userId
     * Get relationship timeline with another user
     */
    async getRelationshipTimeline(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const { userId } = req.params;

            if (!currentUserId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const timeline = await connectionService.getRelationshipTimeline(
                currentUserId,
                userId
            );

            res.json({
                success: true,
                data: timeline
            });
        } catch (error) {
            logger.error('Error fetching relationship timeline:', error);
            res.status(500).json({ error: 'Failed to fetch relationship timeline' });
        }
    }

    /**
     * POST /api/network/connections
     * Create or update connection with another user
     */
    async createConnection(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const { userId, relationshipType } = req.body;

            if (!currentUserId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            const connection = await connectionService.createOrUpdateConnection(
                currentUserId,
                userId,
                relationshipType
            );

            res.json({
                success: true,
                data: connection
            });
        } catch (error) {
            logger.error('Error creating connection:', error);
            res.status(500).json({ error: 'Failed to create connection' });
        }
    }

    /**
     * GET /api/network/collisions/:userId
     * Detect memory overlaps with another user
     */
    async detectCollisions(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const { userId } = req.params;

            if (!currentUserId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const overlaps = await collisionService.detectOverlaps(
                currentUserId,
                userId
            );

            res.json({
                success: true,
                data: overlaps
            });
        } catch (error) {
            logger.error('Error detecting collisions:', error);
            res.status(500).json({ error: 'Failed to detect collisions' });
        }
    }
}

export const networkController = new NetworkController();
