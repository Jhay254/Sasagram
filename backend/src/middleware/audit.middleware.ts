import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { auditService } from '../services/audit.service';

/**
 * Middleware to automatically log write operations
 * Captures POST, PUT, PATCH, DELETE requests
 */
export const auditMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Only log write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const originalSend = res.send;

        // Intercept response to log success/failure
        res.send = function (body) {
            // Restore original send
            res.send = originalSend;

            // Log asynchronously
            const userId = req.user?.id;
            const resource = req.baseUrl.split('/').pop() || 'unknown';
            const resourceId = req.params.id;

            // Don't log sensitive body data (passwords, etc)
            const safeBody = { ...req.body };
            if (safeBody.password) delete safeBody.password;
            if (safeBody.token) delete safeBody.token;

            auditService.log({
                userId,
                action: req.method,
                resource,
                resourceId,
                details: {
                    path: req.path,
                    statusCode: res.statusCode,
                    body: safeBody,
                    query: req.query
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            });

            return originalSend.call(this, body);
        };
    }

    next();
};
