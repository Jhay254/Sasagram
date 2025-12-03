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
    async generateBiography(chapters, timeline, style, tone = narrative_1.NarrativeTone.CONVERSATIONAL) {
        const startTime = Date.now();
        logger_1.logger.info(`Generating biography for user ${timeline.userId} in ${style} style with ${tone} tone`);
        // Generate introduction
        const introduction = await this.generateIntroduction(timeline, style, tone);
        // Generate narrative for each chapter
        const chapterNarratives = [];
        let totalCost = 0;
        for (const chapter of chapters) {
            const chapterEvents = timeline.events.filter((e) => chapter.eventIds.includes(e.id));
            const narrative = await this.generateChapterNarrative(chapter, chapterEvents, style, tone);
            // Match media to narrative
            const mediaMatches = await this.matchMediaToNarrative(narrative.narrative, chapterEvents);
            chapterNarratives.push({
                ...narrative,
                mediaMatches,
            });
            totalCost += 0.015; // Estimated cost per chapter
        }
        // Generate conclusion
        const conclusion = await this.generateConclusion(chapters, timeline, style, tone);
        const totalWords = chapterNarratives.reduce((sum, ch) => sum + ch.wordCount, 0);
        const generationTime = Date.now() - startTime;
        const biography = {
            id: `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: timeline.userId,
            title: this.generateBiographyTitle(timeline, style, tone),
            style,
            tone,
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
    async generateChapterNarrative(chapter, events, style, tone) {
        try {
            const prompt = this.buildChapterPrompt(chapter, events, style, tone);
            const systemPrompt = this.getSystemPrompt(style, tone);
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
            };
        }
    }
    /**
     * Build prompt for chapter narrative
     */
    buildChapterPrompt(chapter, events, style, tone) {
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
        let styleInstruction = '';
        switch (style) {
            case narrative_1.NarrativeStyle.CHRONOLOGICAL:
                styleInstruction = `
Write a compelling narrative (300-500 words) that:
- Flows naturally from event to event in chronological order
- Captures the essence of this period
- Uses vivid, engaging language
- Maintains a clear timeline
- Connects events with smooth transitions`;
                break;
            case narrative_1.NarrativeStyle.REFLECTIVE:
                styleInstruction = `
Write a reflective first-person narrative (300-500 words) that:
- Uses "I" perspective throughout
- Includes personal insights and emotions
- Reflects on growth and learning
- Feels intimate and authentic
- Shows vulnerability and honesty`;
                break;
            case narrative_1.NarrativeStyle.THEMATIC:
                styleInstruction = `
Write a thematic narrative (300-500 words) that:
- Groups related experiences by theme
- Shows patterns and evolution
- Connects disparate moments
- Highlights personal growth in ${chapter.dominantCategory}
- May jump between time periods`;
                break;
            case narrative_1.NarrativeStyle.DOCUMENTARY:
                styleInstruction = `
Write an objective third-person narrative (300-500 words) that:
- Uses third-person perspective
- Maintains journalistic objectivity
- Presents facts and observations
- Avoids emotional interpretation
- Reads like a biography`;
                break;
            case narrative_1.NarrativeStyle.HIGHLIGHTS:
                styleInstruction = `
Write a highlights-focused narrative (300-500 words) that:
- Emphasizes major achievements and milestones
- Skips mundane details
- Celebrates successes
- Shows progression and growth
- Maintains an inspirational tone`;
                break;
            default:
                styleInstruction = 'Write a compelling narrative based on the events.';
        }
        const toneInstruction = `
Tone Instruction:
Write with a ${tone} tone. ${this.getToneGuidelines(tone)}
`;
        return `${baseContext}\n${styleInstruction}\n${toneInstruction}`;
    }
    /**
     * Get system prompt for narrative style and tone
     */
    getSystemPrompt(style, tone) {
        const basePrompt = 'You are an expert biographer and storyteller.';
        let stylePrompt = '';
        switch (style) {
            case narrative_1.NarrativeStyle.CHRONOLOGICAL:
                stylePrompt = 'Write engaging life stories in chronological order with smooth narrative flow.';
                break;
            case narrative_1.NarrativeStyle.REFLECTIVE:
                stylePrompt = 'Write intimate, first-person memoirs that capture personal growth and reflection.';
                break;
            case narrative_1.NarrativeStyle.THEMATIC:
                stylePrompt = 'Organize life stories by themes, showing patterns and connections across time.';
                break;
            case narrative_1.NarrativeStyle.DOCUMENTARY:
                stylePrompt = 'Write objective, third-person biographies with journalistic precision.';
                break;
            case narrative_1.NarrativeStyle.HIGHLIGHTS:
                stylePrompt = 'Focus on achievements and milestones, creating inspirational narratives.';
                break;
            default:
                stylePrompt = 'Write compelling life stories.';
        }
        return `${basePrompt} ${stylePrompt} Adopt a ${tone} tone throughout the narrative.`;
    }
    /**
     * Get specific guidelines for each tone
     */
    getToneGuidelines(tone) {
        switch (tone) {
            case narrative_1.NarrativeTone.HUMOROUS:
                return "Find the lighter side of events. Use wit and playful language. Don't take things too seriously.";
            case narrative_1.NarrativeTone.NOSTALGIC:
                return "Evoke a sense of longing for the past. Focus on sensory details and cherished memories. Use warm, sentimental language.";
            case narrative_1.NarrativeTone.INSPIRATIONAL:
                return "Focus on overcoming challenges and personal growth. Use uplifting and motivating language.";
            case narrative_1.NarrativeTone.CYNICAL:
                return "Adopt a skeptical or world-weary perspective. Use dry wit and irony.";
            case narrative_1.NarrativeTone.OPTIMISTIC:
                return "Focus on the positive aspects and future possibilities. Maintain a hopeful and bright outlook.";
            case narrative_1.NarrativeTone.MELANCHOLIC:
                return "Capture the bittersweet nature of life. Allow for sadness and reflection on what has been lost.";
            case narrative_1.NarrativeTone.EMPATHETIC:
                return "Show deep understanding and compassion. Focus on emotional connection and shared humanity.";
            case narrative_1.NarrativeTone.ROMANTIC:
                return "Focus on love, beauty, and emotional intensity. Use poetic and passionate language.";
            case narrative_1.NarrativeTone.FORMAL:
                return "Use proper grammar, sophisticated vocabulary, and a respectful distance. Avoid slang.";
            case narrative_1.NarrativeTone.ACADEMIC:
                return "Analyze events with intellectual rigor. Use precise language and structured arguments.";
            case narrative_1.NarrativeTone.PROFESSIONAL:
                return "Maintain a competent and business-like demeanor. Focus on facts and achievements.";
            case narrative_1.NarrativeTone.CASUAL:
                return "Write as if talking to a friend. Use relaxed language and colloquialisms.";
            case narrative_1.NarrativeTone.WITTY:
                return "Use clever wordplay and sharp observations. Be entertaining and smart.";
            case narrative_1.NarrativeTone.SARCASTIC:
                return "Use irony and biting humor to make points. Be edgy and provocative.";
            case narrative_1.NarrativeTone.CONVERSATIONAL:
                return "Write in a natural, spoken style. Use simple language and direct address.";
            case narrative_1.NarrativeTone.DRAMATIC:
                return "Heighten the emotional stakes. Focus on conflict and resolution. Use intense language.";
            case narrative_1.NarrativeTone.SUSPENSEFUL:
                return "Build tension and anticipation. Hold back information to create mystery.";
            default:
                return "Maintain a consistent and appropriate tone.";
        }
    }
    /**
     * Generate introduction for biography
     */
    async generateIntroduction(timeline, style, tone) {
        const prompt = `Write a compelling introduction (150-200 words) for a biography covering the period from ${timeline.startDate.toLocaleDateString()} to ${timeline.endDate.toLocaleDateString()}.

Total events: ${timeline.events.length}
Style: ${style}
Tone: ${tone}

The introduction should:
- Set the stage for the life story
- Capture the reader's attention
- Provide context for the journey ahead
- Match the ${style} narrative style and ${tone} tone`;
        try {
            const response = await openai_service_1.default.generateText(prompt, {
                model: 'gpt-4-turbo-preview',
                temperature: 0.7,
                maxTokens: 300,
                systemPrompt: this.getSystemPrompt(style, tone),
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
    async generateConclusion(chapters, timeline, style, tone) {
        const prompt = `Write a meaningful conclusion (150-200 words) for a biography with ${chapters.length} chapters.

Style: ${style}
Tone: ${tone}

The conclusion should:
- Reflect on the journey
- Tie together major themes
- Provide closure
- Leave a lasting impression
- Match the ${style} narrative style and ${tone} tone`;
        try {
            const response = await openai_service_1.default.generateText(prompt, {
                model: 'gpt-4-turbo-preview',
                temperature: 0.7,
                maxTokens: 300,
                systemPrompt: this.getSystemPrompt(style, tone),
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
    generateBiographyTitle(timeline, style, tone) {
        const startYear = timeline.startDate.getFullYear();
        const endYear = timeline.endDate.getFullYear();
        const titles = {
            [narrative_1.NarrativeStyle.CHRONOLOGICAL]: `My Journey: ${startYear}-${endYear}`,
            [narrative_1.NarrativeStyle.REFLECTIVE]: `Reflections on a Life: ${startYear}-${endYear}`,
            [narrative_1.NarrativeStyle.THEMATIC]: `Themes of My Life: ${startYear}-${endYear}`,
            [narrative_1.NarrativeStyle.DOCUMENTARY]: `A Life Documented: ${startYear}-${endYear}`,
            [narrative_1.NarrativeStyle.HIGHLIGHTS]: `Milestones and Memories: ${startYear}-${endYear}`,
        };
        // Append tone hint if appropriate, or just return style-based title
        // For simplicity, we'll keep the style-based title but maybe the AI could generate this too in the future
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
