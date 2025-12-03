import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to verify resource ownership
 * Ensures authenticated user owns the resource they're trying to access/modify
 */
export const authorizeOwnership = (resourceType: string, resourceIdParam: string = 'id') => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const resourceId = req.params[resourceIdParam];

            if (!resourceId) {
                return res.status(400).json({ error: 'Resource ID is required' });
            }

            let resource: any;

            switch (resourceType) {
                case 'chapter':
                    resource = await prisma.livingChapter.findUnique({
                        where: { id: resourceId },
                        select: { userId: true }
                    });
                    break;

                case 'tier':
                    resource = await prisma.subscriptionTier.findUnique({
                        where: { id: resourceId },
                        select: { creatorId: true }
                    });
                    break;

                case 'privacy-zone':
                    resource = await prisma.privacyZone.findUnique({
                        where: { id: resourceId },
                        select: { userId: true }
                    });
                    break;

                case 'location-prompt':
                    resource = await prisma.locationPrompt.findUnique({
                        where: { id: resourceId },
                        select: { userId: true }
                    });
                    break;

                default:
                    return res.status(500).json({ error: 'Unknown resource type' });
            }

            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }

            // Get the owner ID (could be userId or creatorId depending on resource)
            const ownerId = resource.userId || resource.creatorId;

            if (ownerId !== userId) {
                return res.status(403).json({ error: 'Unauthorized: You do not own this resource' });
            }

            // Attach resource to request for potential use in route handler
            (req as any).authorizedResource = resource;

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};
