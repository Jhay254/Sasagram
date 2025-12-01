"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalPaywallMiddleware = exports.paywallMiddleware = void 0;
const subscription_service_1 = require("../services/subscription/subscription.service");
const logger_1 = require("../utils/logger");
/**
 * Paywall middleware - protects content behind subscription
 */
const paywallMiddleware = (requiredTier) => {
    return async (req, res, next) => {
        try {
            const { creatorId } = req.params;
            const userId = req.user?.id;
            // Check if user is authenticated
            if (!userId) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'Please log in to access this content',
                });
            }
            // Check if user is the creator (creators have full access to their own content)
            if (userId === creatorId) {
                return next();
            }
            // Check if user has required subscription
            const hasAccess = await subscription_service_1.subscriptionService.checkAccess(userId, creatorId, requiredTier);
            if (!hasAccess) {
                return res.status(403).json({
                    error: 'Subscription required',
                    message: `This content requires a ${requiredTier} subscription or higher`,
                    requiredTier,
                    upgradeUrl: `/subscribe/${creatorId}`,
                });
            }
            // User has access, proceed
            next();
        }
        catch (error) {
            logger_1.logger.error('Paywall middleware error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to verify access',
            });
        }
    };
};
exports.paywallMiddleware = paywallMiddleware;
/**
 * Optional paywall - allows access but includes subscription info
 */
const optionalPaywallMiddleware = (requiredTier) => {
    return async (req, res, next) => {
        try {
            const { creatorId } = req.params;
            const userId = req.user?.id;
            if (!userId || userId === creatorId) {
                return next();
            }
            const hasAccess = await subscription_service_1.subscriptionService.checkAccess(userId, creatorId, requiredTier);
            // Add access info to request
            req.hasSubscription = hasAccess;
            req.requiredTier = requiredTier;
            next();
        }
        catch (error) {
            logger_1.logger.error('Optional paywall middleware error:', error);
            next();
        }
    };
};
exports.optionalPaywallMiddleware = optionalPaywallMiddleware;
