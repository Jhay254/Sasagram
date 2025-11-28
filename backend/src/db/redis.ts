import Redis from 'ioredis';

/**
 * Redis client singleton
 */
class RedisClient {
    private static instance: Redis | null = null;

    static getInstance(): Redis {
        if (!this.instance) {
            this.instance = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_DB || '0'),
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
            });

            this.instance.on('connect', () => {
                console.log('✅ Connected to Redis');
            });

            this.instance.on('error', (error) => {
                console.error('❌ Redis error:', error);
            });
        }

        return this.instance;
    }

    static async disconnect(): Promise<void> {
        if (this.instance) {
            await this.instance.quit();
            this.instance = null;
        }
    }
}

export default RedisClient;
