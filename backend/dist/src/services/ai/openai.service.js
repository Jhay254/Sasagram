"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.isConfigured = exports.streamChatCompletion = exports.batchGenerate = exports.estimateTokens = exports.generateEmbedding = exports.generateText = exports.chatCompletion = void 0;
const openai_1 = __importDefault(require("openai"));
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
/**
 * OpenAI Service
 * Wrapper for OpenAI API with caching, rate limiting, and cost tracking
 */
// Initialize OpenAI client
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION_ID,
});
// Configuration
const CONFIG = {
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    cacheTTL: 7 * 24 * 3600, // 7 days
};
// Token pricing (per 1000 tokens) - Update these based on current OpenAI pricing
const TOKEN_PRICING = {
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
};
/**
 * Calculate cost based on token usage
 */
const calculateCost = (model, inputTokens, outputTokens) => {
    const pricing = TOKEN_PRICING[model] || TOKEN_PRICING['gpt-4-turbo-preview'];
    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    return inputCost + outputCost;
};
/**
 * Generate a hash for caching prompts
 */
const generatePromptHash = (prompt, options = {}) => {
    const data = JSON.stringify({ prompt, ...options });
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
};
/**
 * Chat Completion with caching
 */
const chatCompletion = async (messages, options = {}) => {
    const model = options.model || CONFIG.model;
    const temperature = options.temperature ?? CONFIG.temperature;
    const maxTokens = options.maxTokens || CONFIG.maxTokens;
    const useCache = options.useCache !== false; // Default to true
    // Add system prompt if provided
    const fullMessages = options.systemPrompt
        ? [{ role: 'system', content: options.systemPrompt }, ...messages]
        : messages;
    // Generate cache key
    const promptHash = generatePromptHash(JSON.stringify(fullMessages), { model, temperature, maxTokens });
    const cacheKey = redis_1.CacheKeys.aiResponse(promptHash);
    // Check cache
    if (useCache) {
        const cached = await redis_1.cacheService.get(cacheKey);
        if (cached) {
            (0, logger_1.logAIOperation)('chat_completion_cached', {
                model,
                promptHash,
                messageCount: fullMessages.length,
            });
            return { ...cached, cached: true };
        }
    }
    try {
        // Make API call
        const startTime = Date.now();
        const response = await openai.chat.completions.create({
            model,
            messages: fullMessages,
            temperature,
            max_tokens: maxTokens,
        });
        const duration = Date.now() - startTime;
        const content = response.choices[0]?.message?.content || '';
        const usage = {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
        };
        const cost = calculateCost(model, usage.promptTokens, usage.completionTokens);
        // Log operation
        (0, logger_1.logAIOperation)('chat_completion', {
            model,
            promptHash,
            messageCount: fullMessages.length,
            duration,
            ...usage,
        });
        (0, logger_1.logAICost)('chat_completion', usage.totalTokens, cost, model);
        const result = { content, usage, cost, cached: false };
        // Cache result
        if (useCache) {
            await redis_1.cacheService.set(cacheKey, result, CONFIG.cacheTTL);
        }
        return result;
    }
    catch (error) {
        (0, logger_1.logAIError)('chat_completion', error, { model, messageCount: fullMessages.length });
        throw new Error(`OpenAI API error: ${error.message}`);
    }
};
exports.chatCompletion = chatCompletion;
/**
 * Generate text from a single prompt
 */
const generateText = async (prompt, options = {}) => {
    const messages = [
        { role: 'user', content: prompt },
    ];
    const result = await (0, exports.chatCompletion)(messages, options);
    return {
        text: result.content,
        usage: result.usage,
        cost: result.cost,
    };
};
exports.generateText = generateText;
/**
 * Generate embeddings for text
 */
const generateEmbedding = async (text, model = 'text-embedding-3-small') => {
    try {
        const response = await openai.embeddings.create({
            model,
            input: text,
        });
        const embedding = response.data[0]?.embedding || [];
        (0, logger_1.logAIOperation)('generate_embedding', {
            model,
            textLength: text.length,
            embeddingDimensions: embedding.length,
        });
        return embedding;
    }
    catch (error) {
        (0, logger_1.logAIError)('generate_embedding', error, { model, textLength: text.length });
        throw new Error(`OpenAI embedding error: ${error.message}`);
    }
};
exports.generateEmbedding = generateEmbedding;
/**
 * Count tokens in text (approximate)
 * For accurate counting, use tiktoken library
 */
const estimateTokens = (text) => {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
};
exports.estimateTokens = estimateTokens;
/**
 * Batch process multiple prompts with rate limiting
 */
const batchGenerate = async (prompts, options = {}) => {
    const batchSize = options.batchSize || 5;
    const delayMs = options.delayMs || 1000; // 1 second delay between batches
    const results = [];
    for (let i = 0; i < prompts.length; i += batchSize) {
        const batch = prompts.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((prompt) => (0, exports.generateText)(prompt, options)));
        results.push(...batchResults);
        // Delay between batches to avoid rate limits
        if (i + batchSize < prompts.length) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return results;
};
exports.batchGenerate = batchGenerate;
/**
 * Stream chat completion (for real-time responses)
 */
const streamChatCompletion = async (messages, onChunk, options = {}) => {
    const model = options.model || CONFIG.model;
    const temperature = options.temperature ?? CONFIG.temperature;
    const maxTokens = options.maxTokens || CONFIG.maxTokens;
    const fullMessages = options.systemPrompt
        ? [{ role: 'system', content: options.systemPrompt }, ...messages]
        : messages;
    try {
        const stream = await openai.chat.completions.create({
            model,
            messages: fullMessages,
            temperature,
            max_tokens: maxTokens,
            stream: true,
        });
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                onChunk(content);
            }
        }
        (0, logger_1.logAIOperation)('stream_chat_completion', {
            model,
            messageCount: fullMessages.length,
        });
    }
    catch (error) {
        (0, logger_1.logAIError)('stream_chat_completion', error, { model, messageCount: fullMessages.length });
        throw new Error(`OpenAI streaming error: ${error.message}`);
    }
};
exports.streamChatCompletion = streamChatCompletion;
/**
 * Check if OpenAI API is configured
 */
const isConfigured = () => {
    return !!process.env.OPENAI_API_KEY;
};
exports.isConfigured = isConfigured;
/**
 * Test OpenAI connection
 */
const testConnection = async () => {
    try {
        await (0, exports.generateText)('Hello, this is a test.', {
            maxTokens: 10,
            useCache: false,
        });
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.testConnection = testConnection;
exports.default = {
    chatCompletion: exports.chatCompletion,
    generateText: exports.generateText,
    generateEmbedding: exports.generateEmbedding,
    estimateTokens: exports.estimateTokens,
    batchGenerate: exports.batchGenerate,
    streamChatCompletion: exports.streamChatCompletion,
    isConfigured: exports.isConfigured,
    testConnection: exports.testConnection,
};
