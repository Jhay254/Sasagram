import * as Joi from 'joi';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Environment Variables Schema
 * Validates all required environment variables on startup
 */
const envSchema = Joi.object({
    // Server
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),

    // Database
    DATABASE_URL: Joi.string().required(),

    // JWT
    JWT_SECRET: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),

    // Frontend
    FRONTEND_URL: Joi.string().uri().default('http://localhost:3001'),

    // Redis
    REDIS_HOST: Joi.string().default('127.0.0.1'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').optional(),
    REDIS_DB: Joi.number().default(0),

    // OAuth - Instagram
    INSTAGRAM_CLIENT_ID: Joi.string().optional(),
    INSTAGRAM_CLIENT_SECRET: Joi.string().optional(),
    INSTAGRAM_REDIRECT_URI: Joi.string().uri().optional(),

    // OAuth - Twitter
    TWITTER_CLIENT_ID: Joi.string().optional(),
    TWITTER_CLIENT_SECRET: Joi.string().optional(),
    TWITTER_REDIRECT_URI: Joi.string().uri().optional(),

    // OAuth - Facebook
    FACEBOOK_CLIENT_ID: Joi.string().optional(),
    FACEBOOK_CLIENT_SECRET: Joi.string().optional(),
    FACEBOOK_REDIRECT_URI: Joi.string().uri().optional(),

    // OAuth - LinkedIn
    LINKEDIN_CLIENT_ID: Joi.string().optional(),
    LINKEDIN_CLIENT_SECRET: Joi.string().optional(),
    LINKEDIN_REDIRECT_URI: Joi.string().uri().optional(),

    // OAuth - Gmail
    GMAIL_CLIENT_ID: Joi.string().optional(),
    GMAIL_CLIENT_SECRET: Joi.string().optional(),
    GMAIL_REDIRECT_URI: Joi.string().uri().optional(),

    // OAuth - Outlook
    OUTLOOK_CLIENT_ID: Joi.string().optional(),
    OUTLOOK_CLIENT_SECRET: Joi.string().optional(),
    OUTLOOK_REDIRECT_URI: Joi.string().uri().optional(),

    // AI Services
    OPENAI_API_KEY: Joi.string().optional(),
    OPENAI_ORGANIZATION_ID: Joi.string().optional(),
    OPENAI_MODEL: Joi.string().default('gpt-4-turbo-preview'),
    OPENAI_MAX_TOKENS: Joi.number().default(4000),
    OPENAI_TEMPERATURE: Joi.number().min(0).max(2).default(0.7),

    // Google Cloud
    GOOGLE_CLOUD_PROJECT_ID: Joi.string().optional(),
    GOOGLE_APPLICATION_CREDENTIALS: Joi.string().optional(),

    // Storage
    UPLOAD_DIR: Joi.string().default('./uploads'),
    MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB

    // Logging
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),
    LOG_DIR: Joi.string().default('./logs'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

    // AI Generation Limits
    MAX_BIOGRAPHY_GENERATIONS_PER_DAY: Joi.number().default(5),
    MAX_TOKENS_PER_USER_PER_DAY: Joi.number().default(100000),
    AI_COST_LIMIT_PER_USER_PER_MONTH: Joi.number().default(10.00),

    // Feature Flags
    ENABLE_AI_GENERATION: Joi.boolean().default(true),
    ENABLE_EMAIL_INTEGRATION: Joi.boolean().default(false),
    ENABLE_PAYMENT: Joi.boolean().default(false),
}).unknown(true); // Allow unknown env vars

/**
 * Validate environment variables
 */
export function validateEnv(): void {
    const { error, value } = envSchema.validate(process.env, {
        abortEarly: false,
        stripUnknown: false,
    });

    if (error) {
        const errors = error.details.map(detail => `${detail.path.join('.')}: ${detail.message}`);
        logger.error('Environment validation failed:');
        errors.forEach(err => logger.error(`  - ${err}`));
        throw new Error('Invalid environment configuration');
    }

    logger.info('Environment variables validated successfully');
}

/**
 * Type-safe environment access
 */
export const env = {
    // Server
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
    PORT: parseInt(process.env.PORT || '3000'),

    // Database
    DATABASE_URL: process.env.DATABASE_URL!,

    // JWT
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,

    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',

    // Redis
    REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_DB: parseInt(process.env.REDIS_DB || '0'),

    // AI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',

    // Storage
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'),

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_DIR: process.env.LOG_DIR || './logs',

    // Feature Flags
    ENABLE_AI_GENERATION: process.env.ENABLE_AI_GENERATION === 'true',
    ENABLE_EMAIL_INTEGRATION: process.env.ENABLE_EMAIL_INTEGRATION === 'true',
    ENABLE_PAYMENT: process.env.ENABLE_PAYMENT === 'true',
};
