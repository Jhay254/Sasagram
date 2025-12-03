"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
/**
 * Custom Error Classes
 */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Error Handler Middleware
 * Centralized error handling for all routes
 */
const errorHandler = (err, req, res, next) => {
    // Default to 500 server error
    let statusCode = 500;
    let message = 'Internal server error';
    let isOperational = false;
    // Check if it's our custom AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }
    // Log error
    if (statusCode >= 500) {
        logger_1.logger.error('Server Error:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userId: req.user?.id,
        });
    }
    else {
        logger_1.logger.warn('Client Error:', {
            message: err.message,
            statusCode,
            url: req.url,
            method: req.method,
        });
    }
    // Send error response
    res.status(statusCode).json({
        error: {
            message,
            statusCode,
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack,
                details: err,
            }),
        },
    });
};
exports.errorHandler = errorHandler;
/**
 * 404 Handler
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.path}`));
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
