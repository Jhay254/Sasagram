import OpenAI from 'openai';
import { cacheService, CacheKeys } from '../config/redis';
import { logAIOperation, logAIError, logAICost } from '../utils/logger';
import crypto from 'crypto';

/**
 * OpenAI Service
 * Wrapper for OpenAI API with caching, rate limiting, and cost tracking
 */

// Initialize OpenAI client
const openai = new OpenAI({
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
const calculateCost = (model: string, inputTokens: number, outputTokens: number): number => {
    const pricing = TOKEN_PRICING[model as keyof typeof TOKEN_PRICING] || TOKEN_PRICING['gpt-4-turbo-preview'];
    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    return inputCost + outputCost;
};

/**
 * Generate a hash for caching prompts
 */
const generatePromptHash = (prompt: string, options: any = {}): string => {
    const data = JSON.stringify({ prompt, ...options });
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Chat Completion with caching
 */
export const chatCompletion = async (
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        useCache?: boolean;
        systemPrompt?: string;
    } = {}
): Promise<{
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
    cost: number;
    cached: boolean;
}> => {
    const model = options.model || CONFIG.model;
    const temperature = options.temperature ?? CONFIG.temperature;
    const maxTokens = options.maxTokens || CONFIG.maxTokens;
    const useCache = options.useCache !== false; // Default to true

    // Add system prompt if provided
    const fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = options.systemPrompt
        ? [{ role: 'system', content: options.systemPrompt }, ...messages]
        : messages;

    // Generate cache key
    const promptHash = generatePromptHash(JSON.stringify(fullMessages), { model, temperature, maxTokens });
    const cacheKey = CacheKeys.aiResponse(promptHash);

    // Check cache
    if (useCache) {
        const cached = await cacheService.get<any>(cacheKey);
        if (cached) {
            logAIOperation('chat_completion_cached', {
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
        logAIOperation('chat_completion', {
            model,
            promptHash,
            messageCount: fullMessages.length,
            duration,
            ...usage,
        });

        logAICost('chat_completion', usage.totalTokens, cost, model);

        const result = { content, usage, cost, cached: false };

        // Cache result
        if (useCache) {
            await cacheService.set(cacheKey, result, CONFIG.cacheTTL);
        }

        return result;
    } catch (error: any) {
        logAIError('chat_completion', error, { model, messageCount: fullMessages.length });
        throw new Error(`OpenAI API error: ${error.message}`);
    }
};

/**
 * Generate text from a single prompt
 */
export const generateText = async (
    prompt: string,
    options: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
        useCache?: boolean;
    } = {}
): Promise<{
    text: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
    cost: number;
}> => {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'user', content: prompt },
    ];

    const result = await chatCompletion(messages, options);
    return {
        text: result.content,
        usage: result.usage,
        cost: result.cost,
    };
};

/**
 * Generate embeddings for text
 */
export const generateEmbedding = async (
    text: string,
    model: string = 'text-embedding-3-small'
): Promise<number[]> => {
    try {
        const response = await openai.embeddings.create({
            model,
            input: text,
        });

        const embedding = response.data[0]?.embedding || [];

        logAIOperation('generate_embedding', {
            model,
            textLength: text.length,
            embeddingDimensions: embedding.length,
        });

        return embedding;
    } catch (error: any) {
        logAIError('generate_embedding', error, { model, textLength: text.length });
        throw new Error(`OpenAI embedding error: ${error.message}`);
    }
};

/**
 * Count tokens in text (approximate)
 * For accurate counting, use tiktoken library
 */
export const estimateTokens = (text: string): number => {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
};

/**
 * Batch process multiple prompts with rate limiting
 */
export const batchGenerate = async (
    prompts: string[],
    options: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
        batchSize?: number;
        delayMs?: number;
    } = {}
): Promise<Array<{
    text: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
    cost: number;
}>> => {
    const batchSize = options.batchSize || 5;
    const delayMs = options.delayMs || 1000; // 1 second delay between batches

    const results: Array<{
        text: string;
        usage: { promptTokens: number; completionTokens: number; totalTokens: number };
        cost: number;
    }> = [];

    for (let i = 0; i < prompts.length; i += batchSize) {
        const batch = prompts.slice(i, i + batchSize);

        const batchResults = await Promise.all(
            batch.map((prompt) => generateText(prompt, options))
        );

        results.push(...batchResults);

        // Delay between batches to avoid rate limits
        if (i + batchSize < prompts.length) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return results;
};

/**
 * Stream chat completion (for real-time responses)
 */
export const streamChatCompletion = async (
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    onChunk: (chunk: string) => void,
    options: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
    } = {}
): Promise<void> => {
    const model = options.model || CONFIG.model;
    const temperature = options.temperature ?? CONFIG.temperature;
    const maxTokens = options.maxTokens || CONFIG.maxTokens;

    const fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = options.systemPrompt
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

        logAIOperation('stream_chat_completion', {
            model,
            messageCount: fullMessages.length,
        });
    } catch (error: any) {
        logAIError('stream_chat_completion', error, { model, messageCount: fullMessages.length });
        throw new Error(`OpenAI streaming error: ${error.message}`);
    }
};

/**
 * Check if OpenAI API is configured
 */
export const isConfigured = (): boolean => {
    return !!process.env.OPENAI_API_KEY;
};

/**
 * Test OpenAI connection
 */
export const testConnection = async (): Promise<boolean> => {
    try {
        await generateText('Hello, this is a test.', {
            maxTokens: 10,
            useCache: false,
        });
        return true;
    } catch (error) {
        return false;
    }
};

export default {
    chatCompletion,
    generateText,
    generateEmbedding,
    estimateTokens,
    batchGenerate,
    streamChatCompletion,
    isConfigured,
    testConnection,
};
