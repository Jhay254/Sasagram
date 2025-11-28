import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface BiographyOutline {
    title: string;
    description: string;
    chapters: {
        title: string;
        timeperiod: string;
        startDate?: string;
        endDate?: string;
        summary: string;
    }[];
}

interface UserDataPoint {
    type: 'social_post' | 'media_item' | 'email_event';
    timestamp: Date;
    content?: string;
    location?: string;
    category?: string;
    metadata?: any;
}

export class AIService {
    // Generate biography outline from user data
    static async generateBiographyOutline(
        userDataPoints: UserDataPoint[],
        userName: string
    ): Promise<BiographyOutline> {
        const dataСummary = this.summarizeDataPoints(userDataPoints);

        const prompt = `You are a professional biographer. Based on the following data points from ${userName}'s digital life, create a compelling biography outline.

Data Summary:
${dataСummary}

Create a biography structure with:
1. An engaging title
2. A brief description (2-3 sentences)
3. 5-10 chapters organized chronologically or thematically

Each chapter should have:
- A compelling title
- A time period (e.g., "Childhood", "2015-2018", "Early Career")
- Start and end dates if applicable
- A brief summary of what the chapter will cover

Return the result as JSON in this format:
{
  "title": "Biography title",
  "description": "Brief description",
  "chapters": [
    {
      "title": "Chapter title",
      "timeperiod": "Time period",
      "startDate": "2015-01-01" (optional),
      "endDate": "2018-12-31" (optional),
      "summary": "What this chapter covers"
    }
  ]
}

Be creative, narrative-focused, and ensure chronological coherence. Only use information from the provided data - do not hallucinate.`;

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a skilled biographer who creates compelling life stories from digital data. You are factual, creative, and narrative-focused.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from AI');
        }

        return JSON.parse(content);
    }

    // Generate chapter content
    static async generateChapterContent(
        chapterSummary: string,
        relevantData: UserDataPoint[],
        previousChapterContent?: string
    ): Promise<string> {
        const dataContext = this.formatDataForChapter(relevantData);

        const prompt = `You are writing a chapter for someone's biography. 

Chapter Summary: ${chapterSummary}

Relevant Data:
${dataContext}

${previousChapterContent ? `Previous Chapter Context (for continuity):\n${previousChapterContent.slice(0, 500)}...\n` : ''}

Write a compelling, narrative-style chapter (800-1500 words) that:
1. Tells a story based on the provided data
2. Maintains a warm, engaging tone
3. Connects events chronologically
4. Highlights meaningful moments
5. Stays factual - only use information from the provided data

Write in third person or first person based on the natural flow. Focus on storytelling, not just listing events.`;

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a narrative biographer who transforms life events into compelling stories. You write with warmth, insight, and literary quality.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.8,
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        });

        return response.choices[0]?.message?.content || '';
    }

    // Extract timeline events from data
    static async extractTimelineEvents(
        userDataPoints: UserDataPoint[]
    ): Promise<Array<{
        date: string;
        title: string;
        description: string;
        category: string;
        location?: string;
    }>> {
        const dataСummary = this.summarizeDataPoints(userDataPoints);

        const prompt = `Analyze these data points and extract significant life events for a timeline.

Data:
${dataСummary}

Identify 10-20 key events that would be meaningful in a biography timeline. For each event, provide:
- date: ISO date string
- title: Short, descriptive title (5-10 words)
- description: Brief description (1-2 sentences)
- category: One of: LIFE_EVENT, TRAVEL, CAREER, EDUCATION, RELATIONSHIP, ACHIEVEMENT, OTHER
- location: If mentioned

Return as JSON array:
[
  {
    "date": "2020-06-15",
    "title": "Event title",
    "description": "Event description",
    "category": "CATEGORY",
    "location": "City, Country"
  }
]

Only include events with clear dates. Be selective - focus on significant moments.`;

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an expert at identifying significant life events from digital data.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.5,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            return [];
        }

        const parsed = JSON.parse(content);
        return parsed.events || parsed;
    }

    // Helper: Summarize data points for prompts
    private static summarizeDataPoints(dataPoints: UserDataPoint[]): string {
        const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        const summary = sorted.map((point, index) => {
            const date = point.timestamp.toISOString().split('T')[0];
            let line = `${index + 1}. [${date}] ${point.type}`;

            if (point.content) {
                line += `: ${point.content.slice(0, 200)}${point.content.length > 200 ? '...' : ''}`;
            }

            if (point.location) {
                line += ` (Location: ${point.location})`;
            }

            return line;
        });

        return summary.join('\n');
    }

    // Helper: Format data for chapter context
    private static formatDataForChapter(dataPoints: UserDataPoint[]): string {
        const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        return sorted
            .map((point) => {
                const date = point.timestamp.toISOString().split('T')[0];
                const parts = [
                    `Date: ${date}`,
                    point.content ? `Content: ${point.content}` : null,
                    point.location ? `Location: ${point.location}` : null,
                ].filter(Boolean);

                return `- ${parts.join(' | ')}`;
            })
            .join('\n');
    }

    // Improve/refine existing content
    static async improveContent(content: string, instructions: string): Promise<string> {
        const prompt = `Improve the following biography chapter content according to these instructions:

Instructions: ${instructions}

Original Content:
${content}

Provide the improved version, maintaining the narrative style and factual accuracy.`;

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert editor who improves biographical content while maintaining authenticity.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 4000,
        });

        return response.choices[0]?.message?.content || content;
    }
}
