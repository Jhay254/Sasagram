import Redis from 'ioredis';

async function main() {
    console.log('Testing Redis connection...');
    try {
        const redis = new Redis({
            host: '127.0.0.1',
            port: 6379,
            maxRetriesPerRequest: 1
        });

        console.log('Connecting...');
        const result = await redis.ping();
        console.log('PING result:', result);

        await redis.quit();
    } catch (error) {
        console.error('Redis connection failed:', error);
    }
}

main();
