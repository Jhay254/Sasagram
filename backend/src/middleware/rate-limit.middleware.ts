import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter - applies to all requests
 * 100 requests per 15 minutes
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Auth rate limiter - stricter for login/register
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * OAuth rate limiter
 * 10 requests per 15 minutes
 */
export const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many OAuth requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Media rate limiter
 * 50 requests per 15 minutes
 */
export const mediaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many media requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
