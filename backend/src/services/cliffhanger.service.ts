import prisma from '../db/prisma';
import { AIService } from './ai.service';

export interface CliffhangerAnalysis {
    score: number; // 0-100
    hasCliffhanger: boolean;
    cliffhangerText?: string;
    reasoning?: string;
}

export class CliffhangerService {
    /**
     * Analyze a chapter for cliffhanger endings
     */
    static async analyzeCliffhanger(chapterId: string): Promise<CliffhangerAnalysis> {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
        });

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        const score = await this.calculateScore(chapter.content);
        const cliffhangerText = this.extractCliffhangerText(chapter.content, score);

        const analysis: CliffhangerAnalysis = {
            score,
            hasCliffhanger: score > 60,
            cliffhangerText,
        };

        // Update chapter with cliffhanger data
        await prisma.chapter.update({
            where: { id: chapterId },
            data: {
                cliffhangerScore: score,
                cliffhangerText: cliffhangerText || null,
            },
        });

        return analysis;
    }

    /**
     * Calculate cliffhanger score using AI + heuristics
     */
    static async calculateScore(content: string): Promise<number> {
        // Get last 3 paragraphs
        const paragraphs = content.split(/\n\n+/);
        const lastParagraphs = paragraphs.slice(-3).join('\n\n');

        if (lastParagraphs.length < 50) {
            return 0; // Too short to have meaningful cliffhanger
        }

        // Initialize score with heuristics
        let heuristicScore = this.calculateHeuristicScore(lastParagraphs);

        // Try to use AI for deeper analysis
        try {
            const aiScore = await this.calculateAIScore(lastParagraphs);
            // Combine AI score (65%) with heuristics (35%)
            return Math.min(100, Math.round(aiScore * 0.65 + heuristicScore * 0.35));
        } catch (error) {
            console.error('AI analysis failed, using heuristic-only score:', error);
            // Fallback to heuristic score only
            return Math.min(100, heuristicScore);
        }
    }

    /**
     * Calculate score using heuristics (fallback if AI unavailable)
     */
    private static calculateHeuristicScore(text: string): number {
        let score = 0;

        // Question marks in last paragraph (+10 points)
        const questionMarks = (text.match(/\?/g) || []).length;
        score += Math.min(10, questionMarks * 5);

        // Ellipsis or em-dashes (+10 points)
        if (text.includes('...') || text.includes('—')) {
            score += 10;
        }

        // Suspenseful keywords (+15 points)
        const suspenseKeywords = [
            'suddenly',
            'shocking',
            'unexpected',
            'but then',
            'however',
            'little did',
            'never',
            'until',
            'if only',
            'too late',
            'screamed',
            'disappeared',
            'mysterious',
            'strange',
        ];

        const foundKeywords = suspenseKeywords.filter((keyword) =>
            text.toLowerCase().includes(keyword)
        );
        score += Math.min(15, foundKeywords.length * 3);

        // Sentence fragments (incomplete sentences) (+10 points)
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
        const lastSentence = sentences[sentences.length - 1]?.trim() || '';

        // Check if last sentence is a fragment (short, missing subject/verb)
        if (lastSentence.length < 30 && lastSentence.split(' ').length < 5) {
            score += 10;
        }

        // Ends with exclamation (+5 points)
        if (text.trim().endsWith('!')) {
            score += 5;
        }

        // Emotional intensity words (+10 points)
        const emotionalWords = [
            'terrified',
            'horrified',
            'shocked',
            'stunned',
            'amazed',
            'desperate',
            'frantic',
            'panic',
        ];
        const foundEmotional = emotionalWords.filter((word) =>
            text.toLowerCase().includes(word)
        );
        score += Math.min(10, foundEmotional.length * 5);

        return score;
    }

    /**
     * Use AI to analyze cliffhanger intensity
     */
    private static async calculateAIScore(text: string): Promise<number> {
        const prompt = `Analyze the following text excerpt (the ending of a chapter) and determine if it has a cliffhanger ending. A cliffhanger is a dramatic or unresolved ending that creates suspense and makes readers want to continue.

Rate the cliffhanger intensity on a scale of 0-100:
- 0-20: No cliffhanger, conclusive ending
- 21-40: Mild tension, some open questions
- 41-60: Moderate suspense, unresolved plot points
- 61-80: Strong cliffhanger, dramatic revelation or question
- 81-100: Extreme cliffhanger, major revelation or shocking twist

Text excerpt:
"""
${text}
"""

Respond with ONLY a JSON object in this exact format:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation>"
}`;

        try {
            const response = await AIService.generateText(prompt);

            // Parse JSON response
            const match = response.match(/\{[\s\S]*\}/);
            if (match) {
                const result = JSON.parse(match[0]);
                return Math.max(0, Math.min(100, result.score));
            }

            // Fallback if JSON parsing fails
            console.warn('Failed to parse AI cliffhanger response');
            return 0;
        } catch (error) {
            console.error('AI cliffhanger analysis error:', error);
            throw error;
        }
    }

    /**
     * Extract the cliffhanger text (last paragraph or sentence)
     */
    private static extractCliffhangerText(content: string, score: number): string | undefined {
        if (score < 60) {
            return undefined; // Not a significant cliffhanger
        }

        const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
        const lastParagraph = paragraphs[paragraphs.length - 1];

        // Return last paragraph if it's under 300 characters, otherwise last 2 sentences
        if (lastParagraph.length <= 300) {
            return lastParagraph.trim();
        }

        const sentences = lastParagraph.split(/[.!?]+/).filter((s) => s.trim().length > 0);
        const lastTwoSentences = sentences.slice(-2).join('. ') + '.';

        return lastTwoSentences.trim();
    }

    /**
     * Find optimal break point in content for maximum cliffhanger
     * Returns character position where chapter should end
     */
    static async findOptimalBreakPoint(content: string): Promise<number> {
        const paragraphs = content.split(/\n\n+/);

        if (paragraphs.length < 3) {
            // Too short, return end of content
            return content.length;
        }

        // Test different break points (last 30% of content)
        const startTestingFrom = Math.floor(paragraphs.length * 0.7);
        let bestScore = 0;
        let bestBreakPoint = content.length;

        for (let i = startTestingFrom; i < paragraphs.length; i++) {
            const testContent = paragraphs.slice(0, i + 1).join('\n\n');
            const score = this.calculateHeuristicScore(testContent);

            if (score > bestScore) {
                bestScore = score;
                bestBreakPoint = testContent.length;
            }
        }

        return bestBreakPoint;
    }

    /**
     * Batch analyze cliffhangers for all chapters in a biography
     */
    static async analyzeAllChapters(biographyId: string): Promise<void> {
        const chapters = await prisma.chapter.findMany({
            where: { biographyId },
            orderBy: { order: 'asc' },
        });

        console.log(`Analyzing ${chapters.length} chapters for cliffhangers...`);

        for (const chapter of chapters) {
            try {
                await this.analyzeCliffhanger(chapter.id);
                console.log(`✓ Analyzed chapter: ${chapter.title} (Score: ${chapter.cliffhangerScore})`);
            } catch (error) {
                console.error(`✗ Failed to analyze chapter ${chapter.id}:`, error);
            }
        }
    }
}
