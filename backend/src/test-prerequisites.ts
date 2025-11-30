import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { redisClient } from './config/redis';
import { testConnection as testOpenAI } from './services/ai/openai.service';
import { logger } from './utils/logger';

console.log('Environment loaded from:', path.resolve(__dirname, '../.env'));
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('REDIS_HOST:', process.env.REDIS_HOST);

async function verifyPrerequisites() {
    logger.info('Starting Phase 1.3 Prerequisites Verification...');

    // 1. Verify Redis
    try {
        logger.info('Testing Redis connection...');
        const ping = await redisClient.ping();
        if (ping === 'PONG') {
            logger.info('✅ Redis connection successful');
        } else {
            logger.error('❌ Redis connection failed: Unexpected response');
        }
    } catch (error) {
        logger.error('❌ Redis connection failed:', error);
    }

    // 2. Verify OpenAI
    try {
        logger.info('Testing OpenAI connection...');
        const openAIResult = await testOpenAI();
        if (openAIResult) {
            logger.info('✅ OpenAI connection successful');
        } else {
            logger.error('❌ OpenAI connection failed');
        }
    } catch (error) {
        logger.error('❌ OpenAI connection failed:', error);
    }

    // Cleanup
    await redisClient.quit();
}

verifyPrerequisites();
