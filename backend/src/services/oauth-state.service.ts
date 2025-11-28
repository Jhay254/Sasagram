import RedisClient from '../db/redis';
import { nanoid } from 'nanoid';

/**
 * OAuth state manager using Redis
 * Replaces in-memory Map for production-ready state management
 */
export class OAuthStateManager {
    private static readonly STATE_TTL = 600; // 10 minutes
    private static readonly CODE_VERIFIER_TTL = 600; // 10 minutes

    /**
     * Generate and store OAuth state
     */
    static async createState(userId: string, provider: string): Promise<string> {
        const redis = RedisClient.getInstance();
        const state = nanoid(32);
        const key = `oauth:state:${state}`;

        await redis.setex(
            key,
            this.STATE_TTL,
            JSON.stringify({ userId, provider, createdAt: Date.now() })
        );

        return state;
    }

    /**
     * Verify and consume OAuth state (one-time use)
     */
    static async verifyState(state: string): Promise<{ userId: string; provider: string } | null> {
        const redis = RedisClient.getInstance();
        const key = `oauth:state:${state}`;

        const data = await redis.get(key);
        if (!data) {
            return null;
        }

        // Delete immediately (one-time use)
        await redis.del(key);

        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to parse OAuth state:', error);
            return null;
        }
    }

    /**
     * Store PKCE code verifier for Twitter OAuth
     */
    static async storeCodeVerifier(state: string, codeVerifier: string): Promise<void> {
        const redis = RedisClient.getInstance();
        const key = `oauth:verifier:${state}`;

        await redis.setex(key, this.CODE_VERIFIER_TTL, codeVerifier);
    }

    /**
     * Retrieve PKCE code verifier
     */
    static async getCodeVerifier(state: string): Promise<string | null> {
        const redis = RedisClient.getInstance();
        const key = `oauth:verifier:${state}`;

        const verifier = await redis.get(key);

        // Delete after retrieval (one-time use)
        if (verifier) {
            await redis.del(key);
        }

        return verifier;
    }

    /**
     * Store temporary OAuth data during flow
     */
    static async storeTempData(key: string, data: any, ttl: number = 600): Promise<void> {
        const redis = RedisClient.getInstance();
        await redis.setex(`oauth:temp:${key}`, ttl, JSON.stringify(data));
    }

    /**
     * Retrieve temporary OAuth data
     */
    static async getTempData(key: string): Promise<any | null> {
        const redis = RedisClient.getInstance();
        const data = await redis.get(`oauth:temp:${key}`);

        if (!data) {
            return null;
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to parse temp OAuth data:', error);
            return null;
        }
    }

    /**
     * Clean up expired states (optional, Redis handles via TTL)
     */
    static async cleanup(): Promise<number> {
        const redis = RedisClient.getInstance();

        // Find all oauth: keys
        const keys = await redis.keys('oauth:*');

        let deleted = 0;
        for (const key of keys) {
            const ttl = await redis.ttl(key);

            // Delete if expired (TTL = -2)
            if (ttl === -2) {
                await redis.del(key);
                deleted++;
            }
        }

        return deleted;
    }

    /**
     * Get OAuth state statistics
     */
    static async getStats(): Promise<{
        activeStates: number;
        activeVerifiers: number;
        tempData: number;
    }> {
        const redis = RedisClient.getInstance();

        const stateKeys = await redis.keys('oauth:state:*');
        const verifierKeys = await redis.keys('oauth:verifier:*');
        const tempKeys = await redis.keys('oauth:temp:*');

        return {
            activeStates: stateKeys.length,
            activeVerifiers: verifierKeys.length,
            tempData: tempKeys.length,
        };
    }
}
