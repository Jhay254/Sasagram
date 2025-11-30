import Redis from 'ioredis';

const redis = new Redis({
    host: 'localhost',
    port: 6379,
});

redis.ping().then((result) => {
    console.log('Redis PING:', result);
    redis.quit();
}).catch((err) => {
    console.error('Redis Error:', err);
    process.exit(1);
});
