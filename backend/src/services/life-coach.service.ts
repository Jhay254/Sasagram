import prisma from '../db/prisma';
import { AIService } from './ai.service';
import { v4 as uuidv4 } from 'uuid';

export class LifeCoachService {
    /**
     * Process a life coach query
     */
    static async processQuery(
        userId: string,
        query: string,
        conversationId?: string
    ) {
        // Check if user has life coach enabled
        const privacy = await prisma.patternPrivacy.findUnique({
            where: { userId },
        });

        if (!privacy?.enableLifeCoach) {
            throw new Error('Life coach feature must be enabled in privacy settings');
        }

        // Generate or use existing conversation ID
        const convId = conversationId || uuidv4();

        // Get user context
        const context = await this.buildUserContext(userId);

        // Generate AI response
        const startTime = Date.now();
        const response = await this.generateCoachResponse(query, context);
        const responseTime = Date.now() - startTime;

        // Save query and response
        const savedQuery = await prisma.lifeCoachQuery.create({
            data: {
                userId,
                conversationId: convId,
                query,
                response: response.text,
                patternsUsed: response.patternsUsed,
                eventsReferenced: response.eventsReferenced,
                responseTime,
                model: response.model,
                tokensUsed: response.tokensUsed,
                promptTokens: response.promptTokens,
                completionTokens: response.completionTokens,
                isPremiumQuery: true,
            },
        });

        return savedQuery;
    }

    /**
     * Build user context for AI coaching
     */
    private static async buildUserContext(userId: string) {
        // Get user info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                biography: true,
            },
        });

        // Get patterns (only if allowed)
        const privacy = await prisma.patternPrivacy.findUnique({
            where: { userId },
        });

        let patterns = [];
        if (privacy?.allowDataForCoaching) {
            patterns = await prisma.pattern.findMany({
                where: { userId },
                orderBy: { confidenceScore: 'desc' },
                take: 5, // Top 5 patterns
            });
        }

        // Get recent significant events
        const recentEvents = await prisma.biographyEvent.findMany({
            where: {
                biography: { userId },
            },
            orderBy: { date: 'desc' },
            take: 10,
        });

        // Get predictions
        const predictions = await prisma.prediction.findMany({
            where: { userId },
            orderBy: { confidenceScore: 'desc' },
            take: 3,
        });

        return {
            userName: user?.displayName || user?.firstName || 'there',
            biographyTitle: user?.biography?.title,
            patterns,
            recentEvents,
            predictions,
        };
    }

    /**
     * Generate AI coach response
     */
    private static async generateCoachResponse(query: string, context: any) {
        // Build system prompt
        const systemPrompt = `You are a compassionate, insightful life coach with access to the user's complete life story and patterns.

About ${context.userName}:
${context.biographyTitle ? `Biography: "${context.biographyTitle}"` : ''}

Detected Life Patterns:
${context.patterns.map((p: any) => `• ${p.title} (${p.confidenceScore}% confidence)\n  ${p.insights}`).join('\n') || 'No patterns detected yet'}

Recent Significant Events:
${context.recentEvents.slice(0, 5).map((e: any) => `• ${e.date.getFullYear()}: ${e.title}`).join('\n') || 'No recent events'}

${context.predictions.length > 0 ? `Predictions:
${context.predictions.map((p: any) => `• ${p.prediction.substring(0, 100)}...`).join('\n')}` : ''}

Your role:
- Provide thoughtful, personalized coaching based on their unique history
- Help them reflect on their patterns and make conscious choices
- Be empathetic, supportive, and action-oriented
- Acknowledge limitations - you're an AI, not a licensed therapist
- If they need professional help (mental health, legal, medical), recommend they consult appropriate professionals

Keep responses concise (2-4 paragraphs), warm, and actionable.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
        ];

        try {
            // Call AI service
            const responseText = await AIService.generateText(
                messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
            );

            // Extract which patterns were likely used (simple heuristic)
            const patternsUsed = context.patterns
                .filter((p: any) => responseText.toLowerCase().includes(p.title.toLowerCase().substring(0, 20)))
                .map((p: any) => p.id);

            return {
                text: responseText.trim(),
                patternsUsed,
                eventsReferenced: [], // Could be enhanced with NER
                model: 'gpt-4',
                tokensUsed: Math.ceil(responseText.length / 4), // Rough estimate
                promptTokens: Math.ceil(systemPrompt.length / 4),
                completionTokens: Math.ceil(responseText.length / 4),
            };
        } catch (error) {
            console.error('Error generating life coach response:', error);
            throw new Error('Failed to generate response. Please try again.');
        }
    }

    /**
     * Get user's conversation history
     */
    static async getConversations(userId: string) {
        const conversations = await prisma.lifeCoachQuery.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        // Group by conversation ID
        const grouped = conversations.reduce((acc: any, query) => {
            if (!acc[query.conversationId]) {
                acc[query.conversationId] = [];
            }
            acc[query.conversationId].push(query);
            return acc;
        }, {});

        return Object.entries(grouped).map(([convId, queries]: [string, any]) => ({
            conversationId: convId,
            messageCount: queries.length,
            lastMessage: queries[0],
            startedAt: queries[queries.length - 1].createdAt,
            queries,
        }));
    }

    /**
     * Get specific conversation
     */
    static async getConversation(userId: string, conversationId: string) {
        return await prisma.lifeCoachQuery.findMany({
            where: {
                userId,
                conversationId,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Generate proactive coaching suggestions
     */
    static async generateProactiveSuggestions(userId: string): Promise<string[]> {
        const context = await this.buildUserContext(userId);

        const suggestions = [];

        // Suggest based on patterns
        if (context.patterns.length > 0) {
            suggestions.push(`Explore your ${context.patterns[0].type.toLowerCase()} patterns`);
            suggestions.push('What do my life patterns reveal about me?');
        }

        // Suggest based on predictions
        if (context.predictions.length > 0) {
            suggestions.push('Tell me about my upcoming predictions');
        }

        // General suggestions
        suggestions.push('What are my strengths based on my history?');
        suggestions.push('How can I break unproductive patterns?');
        suggestions.push('What advice do you have for my career?');
        suggestions.push('Help me reflect on my recent experiences');

        // Return random 4 suggestions
        return suggestions.sort(() => 0.5 - Math.random()).slice(0, 4);
    }

    /**
     * Rate a coach response
     */
    static async rateResponse(queryId: string, rating: number, feedback?: string, wasHelpful?: boolean) {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        await prisma.lifeCoachQuery.update({
            where: { id: queryId },
            data: {
                userRating: rating,
                userFeedback: feedback,
                wasHelpful,
            },
        });
    }

    /**
     * Delete conversation
     */
    static async deleteConversation(userId: string, conversationId: string) {
        await prisma.lifeCoachQuery.deleteMany({
            where: {
                userId,
                conversationId,
            },
        });
    }
}
