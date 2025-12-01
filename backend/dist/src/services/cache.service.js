"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});
redis.on('error', (err) => {
    logger_1.default.error(`Redis cache error: ${err.message}`);
});
redis.on('connect', () => {
    logger_1.default.info('Redis cache connected');
});
class CacheService {
    /**
     * Get cached value
     */
    async get(key) {
        try {
            const value = await redis.get(key);
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.default.error(`Cache get error for key ${key}: ${error.message}`);
            return null;
        }
    }
    /**
     * Set cached value with TTL
     */
    async set(key, value, ttlSeconds = 3600) {
        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(value));
        }
        catch (error) {
            logger_1.default.error(`Cache set error for key ${key}: ${error.message}`);
        }
    }
    /**
     * Delete cached value
     */
    async delete(key) {
        try {
            await redis.del(key);
        }
        catch (error) {
            logger_1.default.error(`Cache delete error for key ${key}: ${error.message}`);
        }
    }
    /**
     * Delete multiple keys by pattern
     */
    async deletePattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                logger_1.default.info(`Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
            }
        }
        catch (error) {
            logger_1.default.error(`Cache delete pattern error for ${pattern}: ${error.message}`);
        }
    }
    /**
     * Check if key exists
     */
    async exists(key) {
        try {
            const result = await redis.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error(`Cache exists error for key ${key}: ${error.message}`);
            return false;
        }
    }
    /**
     * Get or set pattern: Try cache first, fallback to callback
     */
    async getOrSet(key, callback, ttlSeconds = 3600) {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            logger_1.default.debug(`Cache hit for key: ${key}`);
            return cached;
        }
        // Cache miss - fetch from source
        logger_1.default.debug(`Cache miss for key: ${key}`);
        const value = await callback();
        // Store in cache
        await this.set(key, value, ttlSeconds);
        return value;
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
