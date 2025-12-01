"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.narrativeService = exports.NarrativeService = void 0;
const narrative_1 = require("../../types/narrative");
const openai_service_1 = __importDefault(require("../ai/openai.service"));
const logger_1 = require("../../utils/logger");
class NarrativeService {
    /**
     * Generate complete biography with narrative
     */
    async generateBiography(chapters, timeline, style) {
        const startTime = Date.now();
        logger_1.logger.info(`Generating biography for user ${timeline.userId} in ${style} style`);
        // Generate introduction
        const introduction = await this.generateIntroduction(timeline, style);
        // Generate narrative for each chapter
        const chapterNarratives = [];
        let totalCost = 0;
        for (const chapter of chapters) {
            const chapterEvents = timeline.events.filter((e) => chapter.eventIds.includes(e.id));
            const narrative = await this.generateChapterNarrative(chapter, chapterEvents, style);
            // Match media to narrative
            const mediaMatches = await this.matchMediaToNarrative(narrative.narrative, chapterEvents);
            chapterNarratives.push({
                ...narrative,
                mediaMatches,
            });
            totalCost += 0.015; // Estimated cost per chapter
        }
        // Generate conclusion
        const conclusion = await this.generateConclusion(chapters, timeline, style);
        const totalWords = chapterNarratives.reduce((sum, ch) => sum + ch.wordCount, 0);
        const generationTime = Date.now() - startTime;
        const biography = {
            id: `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: timeline.userId,
            title: this.generateBiographyTitle(timeline, style),
            style,
            chapters: chapterNarratives,
            introduction,
            conclusion,
            metadata: {
                totalWords,
                totalChapters: chapters.length,
                generatedAt: new Date(),
                cost: totalCost,
                generationTime,
            },
        };
        logger_1.logger.info(`Biography generated: ${totalWords} words, ${chapters.length} chapters, ${generationTime}ms`);
        return biography;
    }
    /**
     * Generate narrative for a single chapter
     */
    async generateChapterNarrative(chapter, events, style) {
        try {
            const prompt = this.buildChapterPrompt(chapter, events, style);
            const systemPrompt = this.getSystemPrompt(style);
            const response = await openai_service_1.default.generateText(prompt, {
                model: 'gpt-4-turbo-preview',
                temperature: 0.7,
                maxTokens: 600,
                systemPrompt,
            });
            const narrative = response.text.trim();
            const wordCount = narrative.split(/\s+/).length;
            return {
                chapterId: chapter.id,
                title: chapter.title,
                narrative,
                wordCount,
                mediaMatches: [], // Will be filled later
            };
        }
        catch (error) {
            logger_1.logger.error(`Error generating chapter narrative for ${chapter.id}:`, error);
            // Fallback to simple narrative
            return {
                chapterId: chapter.id,
                title: chapter.title,
                narrative: this.generateFallbackNarrative(chapter, events),
                wordCount: 100,
                mediaMatches: [],
            };
        }
    }
    /**
     * Build prompt for chapter narrative
     */
    buildChapterPrompt(chapter, events, style) {
        const eventList = events
            .slice(0, 15) // Limit to avoid token overflow
            .map((e, i) => `${i + 1}. ${e.timestamp.toLocaleDateString()}: ${e.content.substring(0, 150)}`)
            .join('\n');
        const baseContext = `
Chapter: ${chapter.title}
Period: ${chapter.startDate.toLocaleDateString()} to ${chapter.endDate.toLocaleDateString()}
Category: ${chapter.dominantCategory}
Duration: ${chapter.metadata.durationDays} days
Events: ${chapter.metadata.eventCount}

Key Events:
${eventList}
`;
        switch (style) {
            case narrative_1.NarrativeStyle.CHRONOLOGICAL:
                return `${baseContext}

Write a compelling narrative (300-500 words) that:
- Flows naturally from event to event in chronological order
- Captures the essence of this period
- Uses vivid, engaging language
- Maintains a clear timeline
- Connects events with smooth transitions`;
            case narrative_1.NarrativeStyle.REFLECTIVE:
                return `${baseContext}

Write a reflective first-person narrative (300-500 words) that:
- Uses "I" perspective throughout
- Includes personal insights and emotions
- Reflects on growth and learning
- Feels intimate and authentic
- Shows vulnerability and honesty`;
            case narrative_1.NarrativeStyle.THEMATIC:
                return `${baseContext}

Write a thematic narrative (300-500 words) that:
- Groups related experiences by theme
- Shows patterns and evolution
- Connects disparate moments
- Highlights personal growth in ${chapter.dominantCategory}
- May jump between time periods`;
            case narrative_1.NarrativeStyle.DOCUMENTARY:
                return `${baseContext}

Write an objective third-person narrative (300-500 words) that:
- Uses third-person perspective
- Maintains journalistic objectivity
- Presents facts and observations
- Avoids emotional interpretation
- Reads like a biography`;
            case narrative_1.NarrativeStyle.HIGHLIGHTS:
                return `${baseContext}

Write a highlights-focused narrative (300-500 words) that:
- Emphasizes major achievements and milestones
- Skips mundane details
- Celebrates successes
- Shows progression and growth
- Maintains an inspirational tone`;
            default:
                return baseContext;
        }
    }
    /**
     * Get system prompt for narrative style
     */
    getSystemPrompt(style) {
        const basePrompt = 'You are an expert biographer and storyteller.';
        switch (style) {
            case narrative_1.NarrativeStyle.CHRONOLOGICAL:
                return `${basePrompt} Write engaging life stories in chronological order with smooth narrative flow.`;
            case narrative_1.NarrativeStyle.REFLECTIVE:
                return `${basePrompt} Write intimate, first-person memoirs that capture personal growth and reflection.`;
            case narrative_1.NarrativeStyle.THEMATIC:
                return `${basePrompt} Organize life stories by themes, showing patterns and connections across time.`;
            case narrative_1.NarrativeStyle.DOCUMENTARY:
                return `${basePrompt} Write objective, third-person biographies with journalistic precision.`;
            case narrative_1.NarrativeStyle.HIGHLIGHTS:
                return `${basePrompt} Focus on achievements and milestones, creating inspirational narratives.`;
            default:
                return basePrompt;
        }
    }
    /**
     * Generate introduction for biography
     */
    async generateIntroduction(timeline, style) {
        const prompt = `Write a compelling introduction (150-200 words) for a biography covering the period from ${timeline.startDate.toLocaleDateString()} to ${timeline.endDate.toLocaleDateString()}.

Total events: ${timeline.events.length}
Style: ${style}

The introduction should:
- Set the stage for the life story
- Capture the reader's attention
- Provide context for the journey ahead
- Match the ${style} narrative style`;
        try {
            const response = await openai_service_1.default.generateText(prompt, {
                model: 'gpt-4-turbo-preview',
                temperature: 0.7,
                maxTokens: 300,
                systemPrompt: this.getSystemPrompt(style),
            });
            return response.text.trim();
        }
        catch (error) {
            logger_1.logger.error('Error generating introduction:', error);
            return `This is the story of a life, captured through ${timeline.events.length} moments spanning from ${timeline.startDate.toLocaleDateString()} to ${timeline.endDate.toLocaleDateString()}.`;
        }
    }
    /**
     * Generate conclusion for biography
     */
    async generateConclusion(chapters, timeline, style) {
        const prompt = `Write a meaningful conclusion (150-200 words) for a biography with ${chapters.length} chapters.

Style: ${style}

The conclusion should:
- Reflect on the journey
- Tie together major themes
- Provide closure
- Leave a lasting impression
- Match the ${style} narrative style`;
        try {
            const response = await openai_service_1.default.generateText(prompt, {
                model: 'gpt-4-turbo-preview',
                temperature: 0.7,
                maxTokens: 300,
                systemPrompt: this.getSystemPrompt(style),
            });
            return response.text.trim();
        }
        catch (error) {
            logger_1.logger.error('Error generating conclusion:', error);
            return `This journey, spanning ${chapters.length} chapters, represents a life lived with purpose and meaning.`;
        }
    }
    /**
     * Match media to narrative text
     */
    async matchMediaToNarrative(narrative, events) {
        const matches = [];
        // Extract events with media
        const eventsWithMedia = events.filter((e) => e.metadata.mediaUrls);
        for (const event of eventsWithMedia) {
            // Simple keyword matching
            const keywords = event.content.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
            const narrativeLower = narrative.toLowerCase();
            let relevanceScore = 0;
            let bestIndex = -1;
            // Find best placement
            for (const keyword of keywords.slice(0, 5)) {
                const index = narrativeLower.indexOf(keyword);
                if (index !== -1) {
                    relevanceScore += 0.2;
                    if (bestIndex === -1)
                        bestIndex = index;
                }
            }
            if (relevanceScore > 0.3 && event.metadata.mediaUrls) {
                const mediaUrls = event.metadata.mediaUrls.split(',');
                matches.push({
                    mediaId: event.id,
                    mediaUrl: mediaUrls[0],
                    mediaType: 'image',
                    placementIndex: bestIndex,
                    relevanceScore,
                });
            }
        }
        return matches.sort((a, b) => a.placementIndex - b.placementIndex);
    }
    /**
     * Generate biography title
     */
    generateBiographyTitle(timeline, style) {
        const startYear = timeline.startDate.getFullYear();
        const endYear = timeline.endDate.getFullYear();
        const titles = {
            [narrative_1.NarrativeStyle.CHRONOLOGICAL]: `My Journey: ${startYear}-${endYear}`,
            [narrative_1.NarrativeStyle.REFLECTIVE]: `Reflections on a Life: ${startYear}-${endYear}`,
            [narrative_1.NarrativeStyle.THEMATIC]: `Themes of My Life: ${startYear}-${endYear}`,
            [narrative_1.NarrativeStyle.DOCUMENTARY]: `A Life Documented: ${startYear}-${endYear}`,
            [narrative_1.NarrativeStyle.HIGHLIGHTS]: `Milestones and Memories: ${startYear}-${endYear}`,
        };
        return titles[style];
    }
    /**
     * Fallback narrative when AI fails
     */
    generateFallbackNarrative(chapter, events) {
        return `During the period from ${chapter.startDate.toLocaleDateString()} to ${chapter.endDate.toLocaleDateString()}, ${events.length} significant events shaped this chapter of life. ${chapter.summary}`;
    }
}
exports.NarrativeService = NarrativeService;
exports.narrativeService = new NarrativeService();
