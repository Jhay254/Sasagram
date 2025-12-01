"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorizationService = exports.CategorizationService = void 0;
const categories_1 = require("../../types/categories");
const openai_service_1 = __importDefault(require("../ai/openai.service"));
const logger_1 = require("../../utils/logger");
class CategorizationService {
    /**
     * Categorize a single event using AI
     */
    async categorizeEvent(event) {
        try {
            const prompt = this.buildPrompt([event]);
            const response = await openai_service_1.default.generateText(prompt, {
                model: 'gpt-3.5-turbo', // Faster and cheaper for categorization
                temperature: 0.3, // Lower temperature for more consistent classification
                systemPrompt: this.getSystemPrompt(),
            });
            const result = this.parseResponse(response.text);
            return result[0] || this.getDefaultResult();
        }
        catch (error) {
            logger_1.logger.error(`Error categorizing event ${event.id}:`, error);
            return this.getDefaultResult();
        }
    }
    /**
     * Categorize a batch of events (more efficient)
     */
    async categorizeBatch(events) {
        if (events.length === 0)
            return new Map();
        const results = new Map();
        const BATCH_SIZE = 10;
        for (let i = 0; i < events.length; i += BATCH_SIZE) {
            const batch = events.slice(i, i + BATCH_SIZE);
            try {
                const prompt = this.buildPrompt(batch);
                const response = await openai_service_1.default.generateText(prompt, {
                    model: 'gpt-3.5-turbo',
                    temperature: 0.3,
                    systemPrompt: this.getSystemPrompt(),
                });
                const batchResults = this.parseResponse(response.text);
                // Map results back to event IDs
                batch.forEach((event, index) => {
                    if (batchResults[index]) {
                        results.set(event.id, batchResults[index]);
                    }
                    else {
                        results.set(event.id, this.getDefaultResult());
                    }
                });
            }
            catch (error) {
                logger_1.logger.error(`Error categorizing batch ${i}-${i + BATCH_SIZE}:`, error);
                // Fallback for failed batch
                batch.forEach(event => results.set(event.id, this.getDefaultResult()));
            }
        }
        return results;
    }
    getSystemPrompt() {
        return `You are an expert biographer and archivist. Your task is to categorize life events into specific categories and assign relevant tags.
    
Available Categories:
${Object.values(categories_1.BiographyCategory).map(c => `- ${c}`).join('\n')}

Available Tags (you can also create new ones if strictly necessary):
${categories_1.COMMON_TAGS.join(', ')}

Output Format:
Return a JSON array of objects, where each object corresponds to an input event in the same order.
Format:
[
  {
    "category": "Category Name",
    "tags": ["Tag1", "Tag2"],
    "confidence": 0.9,
    "reasoning": "Brief explanation"
  }
]`;
    }
    buildPrompt(events) {
        return `Categorize the following events:\n\n` +
            events.map((e, i) => `Event ${i + 1}:\nContent: ${e.content}\nSource: ${e.sourceType}\nDate: ${e.timestamp.toISOString()}\nMetadata: ${JSON.stringify(e.metadata)}`).join('\n\n---\n\n');
    }
    parseResponse(text) {
        try {
            // Clean up markdown code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            if (Array.isArray(parsed)) {
                return parsed.map(item => ({
                    category: this.validateCategory(item.category),
                    tags: Array.isArray(item.tags) ? item.tags : [],
                    confidence: typeof item.confidence === 'number' ? item.confidence : 0.5,
                    reasoning: item.reasoning || ''
                }));
            }
            return [];
        }
        catch (error) {
            logger_1.logger.error('Error parsing AI response:', error);
            return [];
        }
    }
    validateCategory(category) {
        const values = Object.values(categories_1.BiographyCategory);
        if (values.includes(category)) {
            return category;
        }
        return categories_1.BiographyCategory.OTHER;
    }
    getDefaultResult() {
        return {
            category: categories_1.BiographyCategory.OTHER,
            tags: [],
            confidence: 0,
            reasoning: 'Failed to categorize'
        };
    }
}
exports.CategorizationService = CategorizationService;
exports.categorizationService = new CategorizationService();
