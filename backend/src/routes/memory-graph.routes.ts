import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as memoryGraphController from '../controllers/memory-graph.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get connection graph for visualization
router.get('/graph', memoryGraphController.getConnectionGraph);

// Get list of connections
router.get('/connections', memoryGraphController.getConnections);

// Get shared events with a specific connection
router.get('/connections/:connectionId/events', memoryGraphController.getSharedEvents);

// Get pending collision notifications
router.get('/collisions/pending', memoryGraphController.getPendingCollisions);

// Manually trigger collision detection
router.post('/collisions/detect', memoryGraphController.triggerCollisionDetection);

// Respond to a collision (confirm/decline)
router.post('/collisions/:collisionId/respond', memoryGraphController.respondToCollision);

// Get connection statistics
router.get('/stats', memoryGraphController.getConnectionStats);

export default router;
