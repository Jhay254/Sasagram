import { Request, Response } from 'express';
import { MemoryGraphService } from '../services/memory-graph.service';
import { CollisionDetectionJob } from '../jobs/collision-detection.job';

/**
 * Get user's connection graph
 */
export async function getConnectionGraph(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const graph = await MemoryGraphService.getConnectionGraph(userId);

        res.json({
            success: true,
            data: graph,
        });
    } catch (error: any) {
        console.error('Error getting connection graph:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get user's connections list
 */
export async function getConnections(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const connections = await MemoryGraphService.getUserConnections(userId);

        res.json({
            success: true,
            data: connections,
        });
    } catch (error: any) {
        console.error('Error getting connections:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get shared events with a specific user
 */
export async function getSharedEvents(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { connectionId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const events = await MemoryGraphService.getSharedEvents(userId, connectionId);

        res.json({
            success: true,
            data: events,
        });
    } catch (error: any) {
        console.error('Error getting shared events:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get pending memory collisions (notifications)
 */
export async function getPendingCollisions(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const collisions = await MemoryGraphService.getPendingCollisions(userId);

        res.json({
            success: true,
            data: collisions,
        });
    } catch (error: any) {
        console.error('Error getting pending collisions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Manually trigger collision detection for current user
 */
export async function triggerCollisionDetection(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const collisionCount = await CollisionDetectionJob.detectForUser(userId);

        res.json({
            success: true,
            message: `Found ${collisionCount} potential collisions`,
            data: { collisionCount },
        });
    } catch (error: any) {
        console.error('Error triggering collision detection:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Confirm or decline a memory collision
 */
export async function respondToCollision(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { collisionId } = req.params;
        const { action } = req.body; // 'confirm' or 'decline'

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await MemoryGraphService.respondToCollision(userId, collisionId, action);

        res.json({
            success: true,
            message: `Collision ${action}ed successfully`,
        });
    } catch (error: any) {
        console.error('Error responding to collision:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get connection statistics
 */
export async function getConnectionStats(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const stats = await MemoryGraphService.getConnectionStats(userId);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        console.error('Error getting connection stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
