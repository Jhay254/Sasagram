import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for OAuth errors
 */
export class OAuthError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code: string = 'OAUTH_ERROR',
        public provider?: string
    ) {
        super(message);
        this.name = 'OAuthError';
    }
}

/**
 * Custom error class for sync errors
 */
export class SyncError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code: string = 'SYNC_ERROR',
        public provider?: string,
        public dataSourceId?: string
    ) {
        super(message);
        this.name = 'SyncError';
    }
}

/**
 * Enhanced error handler middleware
 */
export function errorHandler(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Error:', error);

    // OAuth errors
    if (error instanceof OAuthError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                provider: error.provider,
            },
        });
        return;
    }

    // Sync errors
    if (error instanceof SyncError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                provider: error.provider,
                dataSourceId: error.dataSourceId,
            },
        });
        return;
    }

    // Prisma errors
    if (error.code && error.code.startsWith('P')) {
        res.status(400).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Database operation failed',
            },
        });
        return;
    }

    // Axios errors (API calls)
    if (error.isAxiosError) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.error_description ||
            error.response?.data?.message ||
            error.message;

        res.status(status).json({
            success: false,
            error: {
                code: 'EXTERNAL_API_ERROR',
                message,
                provider: error.config?.url,
            },
        });
        return;
    }

    // Validation errors
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: error.message,
                details: error.errors,
            },
        });
        return;
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Authentication token is invalid or expired',
            },
        });
        return;
    }

    // Default error
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message || 'An unexpected error occurred',
        },
    });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
}
