import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/auth/auth.service';

export interface AuthRequest extends Request {
    user?: TokenPayload;
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const payload = authService.verifyAccessToken(token);

        // Attach user to request
        req.user = payload;

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = authService.verifyAccessToken(token);
            req.user = payload;
        }
    } catch (error) {
        // Ignore errors for optional auth
    }
    next();
};
