"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const redis_1 = require("./config/redis");
const openai_service_1 = require("./services/ai/openai.service");
const logger_1 = require("./utils/logger");
console.log('Environment loaded from:', path_1.default.resolve(__dirname, '../.env'));
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('REDIS_HOST:', process.env.REDIS_HOST);
async function verifyPrerequisites() {
    logger_1.logger.info('Starting Phase 1.3 Prerequisites Verification...');
    // 1. Verify Redis
    try {
        logger_1.logger.info('Testing Redis connection...');
        const ping = await redis_1.redisClient.ping();
        if (ping === 'PONG') {
            logger_1.logger.info('✅ Redis connection successful');
        }
        else {
            logger_1.logger.error('❌ Redis connection failed: Unexpected response');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Redis connection failed:', error);
    }
    // 2. Verify OpenAI
    try {
        logger_1.logger.info('Testing OpenAI connection...');
        const openAIResult = await (0, openai_service_1.testConnection)();
        if (openAIResult) {
            logger_1.logger.info('✅ OpenAI connection successful');
        }
        else {
            logger_1.logger.error('❌ OpenAI connection failed');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ OpenAI connection failed:', error);
    }
    // Cleanup
    await redis_1.redisClient.quit();
}
verifyPrerequisites();
