"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pkceService = exports.PKCEService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});
redis.on('error', (err) => {
    logger_1.default.error(`Redis connection error: ${err.message}`);
});
redis.on('connect', () => {
    logger_1.default.info('Redis connected for PKCE storage');
});
class PKCEService {
    constructor() {
        this.TTL = 600; // 10 minutes in seconds
    }
    /**
     * Generate a random state parameter
     */
    generateState() {
        return crypto_1.default.randomBytes(32).toString('base64url');
    }
    /**
     * Store PKCE data with state as key
     */
    async store(state, data) {
        try {
            await redis.setex(`pkce:${state}`, this.TTL, JSON.stringify(data));
            logger_1.default.debug(`PKCE data stored for state: ${state}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to store PKCE data: ${error.message}`);
            throw error;
        }
    }
    /**
     * Retrieve and delete PKCE data (one-time use)
     */
    async retrieve(state) {
        try {
            const key = `pkce:${state}`;
            const data = await redis.get(key);
            if (!data) {
                logger_1.default.warn(`No PKCE data found for state: ${state}`);
                return null;
            }
            // Delete after retrieval (one-time use)
            await redis.del(key);
            logger_1.default.debug(`PKCE data retrieved and deleted for state: ${state}`);
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.default.error(`Failed to retrieve PKCE data: ${error.message}`);
            throw error;
        }
    }
    /**
     * Validate state parameter (CSRF protection)
     */
    async validate(state) {
        try {
            const exists = await redis.exists(`pkce:${state}`);
            return exists === 1;
        }
        catch (error) {
            logger_1.default.error(`Failed to validate state: ${error.message}`);
            return false;
        }
    }
    /**
     * Clean up expired PKCE data (called by cron)
     */
    async cleanup() {
        try {
            const keys = await redis.keys('pkce:*');
            let cleaned = 0;
            for (const key of keys) {
                const ttl = await redis.ttl(key);
                if (ttl === -1) {
                    // Key exists but has no TTL (shouldn't happen, but clean it up)
                    await redis.del(key);
                    cleaned++;
                }
            }
            if (cleaned > 0) {
                logger_1.default.info(`Cleaned up ${cleaned} expired PKCE entries`);
            }
            return cleaned;
        }
        catch (error) {
            logger_1.default.error(`Failed to cleanup PKCE data: ${error.message}`);
            return 0;
        }
    }
}
exports.PKCEService = PKCEService;
exports.pkceService = new PKCEService();
