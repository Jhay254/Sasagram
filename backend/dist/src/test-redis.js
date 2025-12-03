"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
async function main() {
    console.log('Testing Redis connection...');
    try {
        const redis = new ioredis_1.default({
            host: '127.0.0.1',
            port: 6379,
            maxRetriesPerRequest: 1
        });
        console.log('Connecting...');
        const result = await redis.ping();
        console.log('PING result:', result);
        await redis.quit();
    }
    catch (error) {
        console.error('Redis connection failed:', error);
    }
}
main();
