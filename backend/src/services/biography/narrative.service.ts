import { Timeline, TimelineEvent } from '../../types/biography';
import { BiographyChapter } from '../../types/chapter';
import {
    Biography,
    BiographyChapterNarrative,
    MediaMatch,
    NarrativeStyle,
    NarrativeTone,
} from '../../types/narrative';
import openaiService from '../ai/openai.service';
import { logger } from '../../utils/logger';

export class NarrativeService {
    /**
     * Generate complete biography with narrative
     */
    async generateBiography(
        chapters: BiographyChapter[],
        timeline: Timeline,
        style: NarrativeStyle,
        tone: NarrativeTone = NarrativeTone.CONVERSATIONAL
    ): Promise<Biography> {
        const startTime = Date.now();
        logger.info(`Generating biography for user ${timeline.userId} in ${style} style with ${tone} tone`);

        // Generate introduction
        const introduction = await this.generateIntroduction(timeline, style, tone);

        // Generate narrative for each chapter
        const chapterNarratives: BiographyChapterNarrative[] = [];
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

        const biography: Biography = {
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

        logger.info(`Biography generated: ${totalWords} words, ${chapters.length} chapters, ${generationTime}ms`);
        return biography;
    }

    /**
     * Generate narrative for a single chapter
     */
    async generateChapterNarrative(
        chapter: BiographyChapter,
        events: TimelineEvent[],
        style: NarrativeStyle,
        tone: NarrativeTone
    ): Promise<Omit<BiographyChapterNarrative, 'mediaMatches'>> {
        try {
            const prompt = this.buildChapterPrompt(chapter, events, style, tone);
            const systemPrompt = this.getSystemPrompt(style, tone);

            const response = await openaiService.generateText(prompt, {
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
        } catch (error) {
            logger.error(`Error generating chapter narrative for ${chapter.id}:`, error);
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
    private buildChapterPrompt(
        chapter: BiographyChapter,
        events: TimelineEvent[],
        style: NarrativeStyle,
        tone: NarrativeTone
    ): string {
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
            case NarrativeStyle.CHRONOLOGICAL:
                styleInstruction = `
Write a compelling narrative (300-500 words) that:
- Flows naturally from event to event in chronological order
- Captures the essence of this period
- Uses vivid, engaging language
- Maintains a clear timeline
- Connects events with smooth transitions`;
                break;
            case NarrativeStyle.REFLECTIVE:
                styleInstruction = `
Write a reflective first-person narrative (300-500 words) that:
- Uses "I" perspective throughout
- Includes personal insights and emotions
- Reflects on growth and learning
- Feels intimate and authentic
- Shows vulnerability and honesty`;
                break;
            case NarrativeStyle.THEMATIC:
                styleInstruction = `
Write a thematic narrative (300-500 words) that:
- Groups related experiences by theme
- Shows patterns and evolution
- Connects disparate moments
- Highlights personal growth in ${chapter.dominantCategory}
- May jump between time periods`;
                break;
            case NarrativeStyle.DOCUMENTARY:
                styleInstruction = `
Write an objective third-person narrative (300-500 words) that:
- Uses third-person perspective
- Maintains journalistic objectivity
- Presents facts and observations
- Avoids emotional interpretation
- Reads like a biography`;
                break;
            case NarrativeStyle.HIGHLIGHTS:
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
    private getSystemPrompt(style: NarrativeStyle, tone: NarrativeTone): string {
        const basePrompt = 'You are an expert biographer and storyteller.';
        let stylePrompt = '';

        switch (style) {
            case NarrativeStyle.CHRONOLOGICAL:
                stylePrompt = 'Write engaging life stories in chronological order with smooth narrative flow.';
                break;
            case NarrativeStyle.REFLECTIVE:
                stylePrompt = 'Write intimate, first-person memoirs that capture personal growth and reflection.';
                break;
            case NarrativeStyle.THEMATIC:
                stylePrompt = 'Organize life stories by themes, showing patterns and connections across time.';
                break;
            case NarrativeStyle.DOCUMENTARY:
                stylePrompt = 'Write objective, third-person biographies with journalistic precision.';
                break;
            case NarrativeStyle.HIGHLIGHTS:
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
    private getToneGuidelines(tone: NarrativeTone): string {
        switch (tone) {
            case NarrativeTone.HUMOROUS:
                return "Find the lighter side of events. Use wit and playful language. Don't take things too seriously.";
            case NarrativeTone.NOSTALGIC:
                return "Evoke a sense of longing for the past. Focus on sensory details and cherished memories. Use warm, sentimental language.";
            case NarrativeTone.INSPIRATIONAL:
                return "Focus on overcoming challenges and personal growth. Use uplifting and motivating language.";
            case NarrativeTone.CYNICAL:
                return "Adopt a skeptical or world-weary perspective. Use dry wit and irony.";
            case NarrativeTone.OPTIMISTIC:
                return "Focus on the positive aspects and future possibilities. Maintain a hopeful and bright outlook.";
            case NarrativeTone.MELANCHOLIC:
                return "Capture the bittersweet nature of life. Allow for sadness and reflection on what has been lost.";
            case NarrativeTone.EMPATHETIC:
                return "Show deep understanding and compassion. Focus on emotional connection and shared humanity.";
            case NarrativeTone.ROMANTIC:
                return "Focus on love, beauty, and emotional intensity. Use poetic and passionate language.";
            case NarrativeTone.FORMAL:
                return "Use proper grammar, sophisticated vocabulary, and a respectful distance. Avoid slang.";
            case NarrativeTone.ACADEMIC:
                return "Analyze events with intellectual rigor. Use precise language and structured arguments.";
            case NarrativeTone.PROFESSIONAL:
                return "Maintain a competent and business-like demeanor. Focus on facts and achievements.";
            case NarrativeTone.CASUAL:
                return "Write as if talking to a friend. Use relaxed language and colloquialisms.";
            case NarrativeTone.WITTY:
                return "Use clever wordplay and sharp observations. Be entertaining and smart.";
            case NarrativeTone.SARCASTIC:
                return "Use irony and biting humor to make points. Be edgy and provocative.";
            case NarrativeTone.CONVERSATIONAL:
                return "Write in a natural, spoken style. Use simple language and direct address.";
            case NarrativeTone.DRAMATIC:
                return "Heighten the emotional stakes. Focus on conflict and resolution. Use intense language.";
            case NarrativeTone.SUSPENSEFUL:
                return "Build tension and anticipation. Hold back information to create mystery.";
            default:
                return "Maintain a consistent and appropriate tone.";
        }
    }

    /**
     * Generate introduction for biography
     */
    private async generateIntroduction(timeline: Timeline, style: NarrativeStyle, tone: NarrativeTone): Promise<string> {
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
            const response = await openaiService.generateText(prompt, {
                model: 'gpt-4-turbo-preview',
                temperature: 0.7,
                maxTokens: 300,
                systemPrompt: this.getSystemPrompt(style, tone),
            });
            return response.text.trim();
        } catch (error) {
            logger.error('Error generating introduction:', error);
            return `This is the story of a life, captured through ${timeline.events.length} moments spanning from ${timeline.startDate.toLocaleDateString()} to ${timeline.endDate.toLocaleDateString()}.`;
        }
    }

    /**
     * Generate conclusion for biography
     */
    private async generateConclusion(
        chapters: BiographyChapter[],
        timeline: Timeline,
        style: NarrativeStyle,
        tone: NarrativeTone
    ): Promise<string> {
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
            const response = await openaiService.generateText(prompt, {
                model: 'gpt-4-turbo-preview',
                temperature: 0.7,
                maxTokens: 300,
                systemPrompt: this.getSystemPrompt(style, tone),
            });
            return response.text.trim();
        } catch (error) {
            logger.error('Error generating conclusion:', error);
            return `This journey, spanning ${chapters.length} chapters, represents a life lived with purpose and meaning.`;
        }
    }

    /**
     * Match media to narrative text
     */
    private async matchMediaToNarrative(
        narrative: string,
        events: TimelineEvent[]
    ): Promise<MediaMatch[]> {
        const matches: MediaMatch[] = [];

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
                    if (bestIndex === -1) bestIndex = index;
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
    private generateBiographyTitle(timeline: Timeline, style: NarrativeStyle, tone: NarrativeTone): string {
        const startYear = timeline.startDate.getFullYear();
        const endYear = timeline.endDate.getFullYear();

        const titles: Record<NarrativeStyle, string> = {
            [NarrativeStyle.CHRONOLOGICAL]: `My Journey: ${startYear}-${endYear}`,
            [NarrativeStyle.REFLECTIVE]: `Reflections on a Life: ${startYear}-${endYear}`,
            [NarrativeStyle.THEMATIC]: `Themes of My Life: ${startYear}-${endYear}`,
            [NarrativeStyle.DOCUMENTARY]: `A Life Documented: ${startYear}-${endYear}`,
            [NarrativeStyle.HIGHLIGHTS]: `Milestones and Memories: ${startYear}-${endYear}`,
        };

        // Append tone hint if appropriate, or just return style-based title
        // For simplicity, we'll keep the style-based title but maybe the AI could generate this too in the future
        return titles[style];
    }

    /**
     * Fallback narrative when AI fails
     */
    private generateFallbackNarrative(chapter: BiographyChapter, events: TimelineEvent[]): string {
        return `During the period from ${chapter.startDate.toLocaleDateString()} to ${chapter.endDate.toLocaleDateString()}, ${events.length} significant events shaped this chapter of life. ${chapter.summary}`;
    }
}

export const narrativeService = new NarrativeService();
