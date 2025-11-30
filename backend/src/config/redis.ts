import Redis from 'ioredis';
import { logger } from '../utils/logger';

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
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            // Only reconnect when the error contains "READONLY"
            return true;
        }
        return false;
    },
};

// Create Redis client instance
export const redisClient = new Redis(redisConfig);

// Event handlers
redisClient.on('connect', () => {
    logger.info('Redis client connected');
});

redisClient.on('ready', () => {
    logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
});

redisClient.on('close', () => {
    logger.warn('Redis client connection closed');
});

redisClient.on('reconnecting', () => {
    logger.info('Redis client reconnecting...');
});

/**
 * Create a new Redis connection (for BullMQ workers)
 * BullMQ requires separate connections for queue and worker
 */
export const createRedisConnection = (): Redis => {
    return new Redis(redisConfig);
};

/**
 * Cache Service
 * Wrapper around Redis for common caching operations
 */
export class CacheService {
    private client: Redis;
    private defaultTTL: number = 3600; // 1 hour in seconds

    constructor(client: Redis = redisClient) {
        this.client = client;
    }

    /**
     * Get value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value in cache with optional TTL
     */
    async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
        try {
            const serialized = JSON.stringify(value);
            await this.client.setex(key, ttl, serialized);
            return true;
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    async delete(key: string): Promise<boolean> {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple keys matching a pattern
     */
    async deletePattern(pattern: string): Promise<number> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) return 0;
            await this.client.del(...keys);
            return keys.length;
        } catch (error) {
            logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Increment a counter
     */
    async increment(key: string, amount: number = 1): Promise<number> {
        try {
            return await this.client.incrby(key, amount);
        } catch (error) {
            logger.error(`Cache increment error for key ${key}:`, error);
            return 0;
        }
    }

    /**
     * Set expiration on existing key
     */
    async expire(key: string, ttl: number): Promise<boolean> {
        try {
            await this.client.expire(key, ttl);
            return true;
        } catch (error) {
            logger.error(`Cache expire error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Get remaining TTL for a key
     */
    async ttl(key: string): Promise<number> {
        try {
            return await this.client.ttl(key);
        } catch (error) {
            logger.error(`Cache TTL error for key ${key}:`, error);
            return -1;
        }
    }

    /**
     * Cache with callback (get or compute)
     */
    async getOrSet<T>(
        key: string,
        callback: () => Promise<T>,
        ttl: number = this.defaultTTL
    ): Promise<T> {
        // Try to get from cache
        const cached = await this.get<T>(key);
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
    async flushAll(): Promise<boolean> {
        try {
            await this.client.flushdb();
            logger.warn('Cache flushed');
            return true;
        } catch (error) {
            logger.error('Cache flush error:', error);
            return false;
        }
    }
}

// Export singleton instance
export const cacheService = new CacheService();

/**
 * Cache key builders for consistency
 */
export const CacheKeys = {
    user: (userId: string) => `user:${userId}`,
    userTimeline: (userId: string) => `timeline:${userId}`,
    userBiography: (userId: string) => `biography:${userId}`,
    userChapter: (userId: string, chapterId: string) => `chapter:${userId}:${chapterId}`,
    aiPrompt: (promptHash: string) => `prompt:${promptHash}`,
    aiResponse: (promptHash: string) => `ai-response:${promptHash}`,
    sentimentCache: (postId: string) => `sentiment:${postId}`,
    mediaAnalysis: (mediaId: string) => `media-analysis:${mediaId}`,
    rateLimitUser: (userId: string) => `rate-limit:user:${userId}`,
    rateLimitIP: (ip: string) => `rate-limit:ip:${ip}`,
    oauthState: (state: string) => `oauth:state:${state}`,
    userTokens: (userId: string, platform: string) => `tokens:${userId}:${platform}`,
};

export default redisClient;
