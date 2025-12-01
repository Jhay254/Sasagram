"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterService = exports.ChapterService = void 0;
const categories_1 = require("../../types/categories");
const openai_service_1 = __importDefault(require("../ai/openai.service"));
const logger_1 = require("../../utils/logger");
class ChapterService {
    /**
     * Generate chapters from a timeline
     */
    async generateChapters(timeline, options = {}) {
        const { minEventsPerChapter = 5, maxEventsPerChapter = 50, minChapterDurationDays = 7, maxChapterDurationDays = 365, useAI = true, } = options;
        logger_1.logger.info(`Generating chapters for user ${timeline.userId}`);
        // 1. Detect chapter boundaries
        const boundaries = this.detectChapterBoundaries(timeline.events, {
            minChapterDurationDays,
            maxChapterDurationDays,
        });
        // 2. Split events into chapters based on boundaries
        const chapters = [];
        let chapterStartIndex = 0;
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i];
            const chapterEvents = timeline.events.slice(chapterStartIndex, boundary.index);
            if (chapterEvents.length >= minEventsPerChapter) {
                const chapter = await this.createChapter(chapterEvents, useAI);
                chapters.push(chapter);
            }
            chapterStartIndex = boundary.index;
        }
        // Add final chapter
        const finalEvents = timeline.events.slice(chapterStartIndex);
        if (finalEvents.length >= minEventsPerChapter) {
            const finalChapter = await this.createChapter(finalEvents, useAI);
            chapters.push(finalChapter);
        }
        logger_1.logger.info(`Generated ${chapters.length} chapters`);
        return chapters;
    }
    /**
     * Detect chapter boundaries using heuristics and patterns
     */
    detectChapterBoundaries(events, options) {
        const boundaries = [];
        const { minChapterDurationDays, maxChapterDurationDays } = options;
        for (let i = 1; i < events.length; i++) {
            const prevEvent = events[i - 1];
            const currentEvent = events[i];
            const timeDiff = currentEvent.timestamp.getTime() - prevEvent.timestamp.getTime();
            const daysDiff = timeDiff / (24 * 60 * 60 * 1000);
            let boundaryStrength = 0;
            let reason = '';
            // Heuristic 1: Significant time gap (>90 days)
            if (daysDiff > 90) {
                boundaryStrength = Math.min(daysDiff / 365, 1.0);
                reason = `Significant time gap: ${Math.floor(daysDiff)} days`;
            }
            // Heuristic 2: Category change
            if (prevEvent.category && currentEvent.category && prevEvent.category !== currentEvent.category) {
                // Check if it's a major category shift
                const majorCategories = [
                    categories_1.BiographyCategory.EDUCATION,
                    categories_1.BiographyCategory.CAREER,
                    categories_1.BiographyCategory.FAMILY,
                    categories_1.BiographyCategory.SIGNIFICANT_EVENTS,
                ];
                if (majorCategories.includes(prevEvent.category) ||
                    majorCategories.includes(currentEvent.category)) {
                    boundaryStrength = Math.max(boundaryStrength, 0.7);
                    reason = reason || `Major category change: ${prevEvent.category} → ${currentEvent.category}`;
                }
            }
            // Heuristic 3: Year boundary
            const prevYear = new Date(prevEvent.timestamp).getFullYear();
            const currentYear = new Date(currentEvent.timestamp).getFullYear();
            if (prevYear !== currentYear) {
                boundaryStrength = Math.max(boundaryStrength, 0.5);
                reason = reason || `Year boundary: ${prevYear} → ${currentYear}`;
            }
            // Heuristic 4: Cluster boundary (from timeline gaps)
            if (daysDiff > minChapterDurationDays && daysDiff < maxChapterDurationDays) {
                boundaryStrength = Math.max(boundaryStrength, 0.4);
                reason = reason || `Natural cluster boundary`;
            }
            // Add boundary if strength is significant
            if (boundaryStrength >= 0.4) {
                boundaries.push({
                    index: i,
                    timestamp: currentEvent.timestamp,
                    reason,
                    strength: boundaryStrength,
                });
            }
        }
        // Sort by strength and filter to avoid too many chapters
        return boundaries
            .sort((a, b) => b.strength - a.strength)
            .filter((boundary, index, arr) => {
            // Ensure minimum distance between boundaries
            if (index === 0)
                return true;
            const prevBoundary = arr[index - 1];
            const distance = Math.abs(boundary.index - prevBoundary.index);
            return distance >= 5; // At least 5 events between chapters
        });
    }
    /**
     * Create a chapter from a set of events
     */
    async createChapter(events, useAI) {
        const startDate = events[0].timestamp;
        const endDate = events[events.length - 1].timestamp;
        const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        // Determine dominant category
        const categoryCount = new Map();
        events.forEach((event) => {
            if (event.category) {
                categoryCount.set(event.category, (categoryCount.get(event.category) || 0) + 1);
            }
        });
        const dominantCategory = Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || categories_1.BiographyCategory.OTHER;
        // Generate title and summary
        let title = '';
        let summary = '';
        let confidence = 0;
        if (useAI && events.length > 0) {
            const aiResult = await this.generateChapterTitleAndSummary(events, dominantCategory);
            title = aiResult.title;
            summary = aiResult.summary;
            confidence = aiResult.confidence;
        }
        else {
            // Fallback: Generate simple title
            title = this.generateSimpleTitle(events, dominantCategory, startDate);
            summary = `A chapter covering ${events.length} events from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.`;
        }
        return {
            id: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            startDate,
            endDate,
            eventIds: events.map((e) => e.id),
            summary,
            dominantCategory: dominantCategory,
            significance: events.length, // Simple metric for now
            metadata: {
                eventCount: events.length,
                durationDays,
                aiGenerated: useAI,
                confidence,
            },
        };
    }
    /**
     * Generate chapter title and summary using AI
     */
    async generateChapterTitleAndSummary(events, dominantCategory) {
        try {
            const eventsContext = events
                .slice(0, 20) // Limit to first 20 events to save tokens
                .map((e, i) => `${i + 1}. ${e.timestamp.toLocaleDateString()}: ${e.content.substring(0, 100)}`)
                .join('\n');
            const prompt = `Based on the following life events, generate a compelling chapter title and a brief summary (2-3 sentences).

Events:
${eventsContext}

Dominant Category: ${dominantCategory}
Total Events: ${events.length}
Time Period: ${events[0].timestamp.toLocaleDateString()} to ${events[events.length - 1].timestamp.toLocaleDateString()}

Output Format (JSON):
{
  "title": "Engaging chapter title (max 8 words)",
  "summary": "Brief summary of this chapter (2-3 sentences)",
  "confidence": 0.9
}`;
            const response = await openai_service_1.default.generateText(prompt, {
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                systemPrompt: 'You are an expert biographer creating chapter titles and summaries for life stories.',
            });
            const parsed = JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
            return {
                title: parsed.title || 'Untitled Chapter',
                summary: parsed.summary || '',
                confidence: parsed.confidence || 0.5,
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating chapter title/summary:', error);
            return {
                title: this.generateSimpleTitle(events, dominantCategory, events[0].timestamp),
                summary: 'Chapter summary unavailable.',
                confidence: 0,
            };
        }
    }
    /**
     * Generate a simple title without AI
     */
    generateSimpleTitle(events, category, startDate) {
        const year = startDate.getFullYear();
        const month = startDate.toLocaleDateString('en-US', { month: 'long' });
        // Category-based titles
        const titleTemplates = {
            [categories_1.BiographyCategory.EDUCATION]: `Education in ${year}`,
            [categories_1.BiographyCategory.CAREER]: `Career Journey - ${year}`,
            [categories_1.BiographyCategory.FAMILY]: `Family Life in ${year}`,
            [categories_1.BiographyCategory.TRAVEL]: `Adventures in ${year}`,
            [categories_1.BiographyCategory.ACHIEVEMENTS]: `Achievements of ${year}`,
            [categories_1.BiographyCategory.SIGNIFICANT_EVENTS]: `Life Changes in ${year}`,
        };
        return titleTemplates[category] || `${month} ${year}`;
    }
}
exports.ChapterService = ChapterService;
exports.chapterService = new ChapterService();
