import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import logger from '../utils/logger';

/**
 * Middleware to require specific user roles
 * Provides Role-Based Access Control (RBAC)
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            logger.warn('Role check attempted without authentication');
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = (req.user as any).role || 'USER';

        if (!allowedRoles.includes(userRole)) {
            logger.warn(`Access denied: user role ${userRole} not in ${allowedRoles.join(', ')}`);
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: userRole
            });
        }

        next();
    };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Middleware to require creator or admin role
 */
export const requireCreatorOrAdmin = requireRole('CREATOR', 'ADMIN');
