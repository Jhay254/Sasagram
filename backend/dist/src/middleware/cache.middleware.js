"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = exports.cacheMiddleware = void 0;
const cache_service_1 = require("../services/cache.service");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Cache middleware factory
 * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
const cacheMiddleware = (ttlSeconds = 300) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        // Generate cache key from URL and query params
        const cacheKey = `cache:${req.originalUrl || req.url}`;
        try {
            // Try to get from cache
            const cachedResponse = await cache_service_1.cacheService.get(cacheKey);
            if (cachedResponse) {
                logger_1.default.debug(`Serving cached response for: ${cacheKey}`);
                return res.json(cachedResponse);
            }
            // Cache miss - intercept response
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                // Store in cache
                cache_service_1.cacheService.set(cacheKey, body, ttlSeconds).catch(err => {
                    logger_1.default.error(`Failed to cache response: ${err.message}`);
                });
                // Send response
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            logger_1.default.error(`Cache middleware error: ${error.message}`);
            next();
        }
    };
};
exports.cacheMiddleware = cacheMiddleware;
/**
 * Invalidate cache by pattern
 */
const invalidateCache = (pattern) => {
    return async (req, res, next) => {
        try {
            await cache_service_1.cacheService.deletePattern(pattern);
            next();
        }
        catch (error) {
            logger_1.default.error(`Cache invalidation error: ${error.message}`);
            next();
        }
    };
};
exports.invalidateCache = invalidateCache;
