import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionTier } from '@prisma/client';

// Extend Express Request to include subscription info
declare global {
    namespace Express {
        interface Request {
            subscriptionAccess?: {
                isSubscribed: boolean;
                tier?: SubscriptionTier;
                expiresAt?: Date;
            };
        }
    }
}

// Middleware to check if user has active subscription to creator
export const requireSubscription = (
    creatorIdParam?: string,
    minTier?: SubscriptionTier
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Get creator ID from params, body, or query
            const creatorId =
                creatorIdParam ||
                req.params.creatorId ||
                req.body.creatorId ||
                req.query.creatorId;

            if (!creatorId) {
                return res.status(400).json({ error: 'Creator ID required' });
            }

            // Check subscription status
            const subscriptionStatus = await SubscriptionService.checkSubscriptionStatus(
                userId,
                creatorId as string
            );

            if (!subscriptionStatus.isSubscribed) {
                return res.status(402).json({
                    error: 'Subscription required',
                    message: 'This content requires an active subscription',
                    creatorId,
                });
            }

            // Check minimum tier if specified
            if (minTier && subscriptionStatus.tier) {
                const tierComparison = SubscriptionService.compareTiers(
                    subscriptionStatus.tier,
                    minTier
                );

                if (tierComparison < 0) {
                    return res.status(403).json({
                        error: 'Insufficient subscription tier',
                        message: `This content requires ${minTier} tier or higher`,
                        currentTier: subscriptionStatus.tier,
                        requiredTier: minTier,
                    });
                }
            }

            // Attach subscription info to request
            req.subscriptionAccess = subscriptionStatus;

            next();
        } catch (error) {
            console.error('Subscription check error:', error);
            res.status(500).json({ error: 'Failed to verify subscription' });
        }
    };
};

// Check biography access (biography-specific check)
export const checkBiographyAccess = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = (req as any).user?.id;
        const biographyId = req.params.biographyId || req.params.id;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!biographyId) {
            return res.status(400).json({ error: 'Biography ID required' });
        }

        // TODO: Get biography and check if it requires subscription
        // This will be implemented when biography controller is created
        // For now, pass through
        next();
    } catch (error) {
        console.error('Biography access check error:', error);
        res.status(500).json({ error: 'Failed to verify biography access' });
    }
};

// Get user's access level to creator
export const getAccessLevel = (creatorId: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                req.subscriptionAccess = { isSubscribed: false };
                return next();
            }

            const subscriptionStatus = await SubscriptionService.checkSubscriptionStatus(
                userId,
                creatorId
            );

            req.subscriptionAccess = subscriptionStatus;
            next();
        } catch (error) {
            console.error('Access level check error:', error);
            req.subscriptionAccess = { isSubscribed: false };
            next();
        }
    };
};
