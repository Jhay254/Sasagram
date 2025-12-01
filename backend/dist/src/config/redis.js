"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = exports.cacheService = exports.CacheService = exports.createRedisConnection = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
/**
 * Redis Client Configuration
 * Used for caching, session storage, and BullMQ job queues
 */
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            // Only reconnect when the error contains "READONLY"
            return true;
        }
        return false;
    },
};
// Create Redis client instance
exports.redisClient = new ioredis_1.default(redisConfig);
// Event handlers
exports.redisClient.on('connect', () => {
    logger_1.logger.info('Redis client connected');
});
exports.redisClient.on('ready', () => {
    logger_1.logger.info('Redis client ready');
});
exports.redisClient.on('error', (err) => {
    logger_1.logger.error('Redis client error:', err);
});
exports.redisClient.on('close', () => {
    logger_1.logger.warn('Redis client connection closed');
});
exports.redisClient.on('reconnecting', () => {
    logger_1.logger.info('Redis client reconnecting...');
});
/**
 * Create a new Redis connection (for BullMQ workers)
 * BullMQ requires separate connections for queue and worker
 */
const createRedisConnection = () => {
    return new ioredis_1.default(redisConfig);
};
exports.createRedisConnection = createRedisConnection;
/**
 * Cache Service
 * Wrapper around Redis for common caching operations
 */
class CacheService {
    constructor(client = exports.redisClient) {
        this.defaultTTL = 3600; // 1 hour in seconds
        this.client = client;
    }
    /**
     * Get value from cache
     */
    async get(key) {
        try {
            const value = await this.client.get(key);
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    /**
     * Set value in cache with optional TTL
     */
    async set(key, value, ttl = this.defaultTTL) {
        try {
            const serialized = JSON.stringify(value);
            await this.client.setex(key, ttl, serialized);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Delete value from cache
     */
    async delete(key) {
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Delete multiple keys matching a pattern
     */
    async deletePattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0)
                return 0;
            await this.client.del(...keys);
            return keys.length;
        }
        catch (error) {
            logger_1.logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
            return 0;
        }
    }
    /**
     * Check if key exists
     */
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Increment a counter
     */
    async increment(key, amount = 1) {
        try {
            return await this.client.incrby(key, amount);
        }
        catch (error) {
            logger_1.logger.error(`Cache increment error for key ${key}:`, error);
            return 0;
        }
    }
    /**
     * Set expiration on existing key
     */
    async expire(key, ttl) {
        try {
            await this.client.expire(key, ttl);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Cache expire error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Get remaining TTL for a key
     */
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            logger_1.logger.error(`Cache TTL error for key ${key}:`, error);
            return -1;
        }
    }
    /**
     * Cache with callback (get or compute)
     */
    async getOrSet(key, callback, ttl = this.defaultTTL) {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        // Compute value
        const value = await callback();
        // Store in cache
        await this.set(key, value, ttl);
        return value;
    }
    /**
     * Flush all cache (use with caution!)
     */
    async flushAll() {
        try {
            await this.client.flushdb();
            logger_1.logger.warn('Cache flushed');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache flush error:', error);
            return false;
        }
    }
}
exports.CacheService = CacheService;
// Export singleton instance
exports.cacheService = new CacheService();
/**
 * Cache key builders for consistency
 */
exports.CacheKeys = {
    user: (userId) => `user:${userId}`,
    userTimeline: (userId) => `timeline:${userId}`,
    userBiography: (userId) => `biography:${userId}`,
    userChapter: (userId, chapterId) => `chapter:${userId}:${chapterId}`,
    aiPrompt: (promptHash) => `prompt:${promptHash}`,
    aiResponse: (promptHash) => `ai-response:${promptHash}`,
    sentimentCache: (postId) => `sentiment:${postId}`,
    mediaAnalysis: (mediaId) => `media-analysis:${mediaId}`,
    rateLimitUser: (userId) => `rate-limit:user:${userId}`,
    rateLimitIP: (ip) => `rate-limit:ip:${ip}`,
    oauthState: (state) => `oauth:state:${state}`,
    userTokens: (userId, platform) => `tokens:${userId}:${platform}`,
};
exports.default = exports.redisClient;
