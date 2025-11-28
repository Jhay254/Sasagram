import prisma from '../db/prisma';
import { AIService } from './ai.service';
import { PatternType, PatternFrequency } from '@prisma/client';

interface DetectedPattern {
    type: PatternType;
    title: string;
    description: string;
    insights: string;
    recommendations?: string;
    firstOccurrence: Date;
    lastOccurrence: Date;
    frequency: PatternFrequency;
    occurrenceCount: number;
    confidenceScore: number;
    events: Array<{
        biographyEventId?: string;
        eventDate: Date;
        relevanceScore: number;
        eventSummary?: string;
    }>;
}

export class PatternDetectionService {
    /**
     * Detect all patterns for a user
     */
    static async detectAllPatterns(userId: string): Promise<any[]> {
        // Check if user has pattern detection enabled
        const privacy = await this.getOrCreatePrivacy(userId);

        if (!privacy.enablePatternDetection) {
            console.log(`Pattern detection disabled for user ${userId}`);
            return [];
        }

        const patterns: DetectedPattern[] = [];

        // Detect each pattern type if enabled
        if (privacy.enableCareerPatterns) {
            const careerPatterns = await this.detectCareerPatterns(userId);
            patterns.push(...careerPatterns);
        }

        if (privacy.enableRelationshipPatterns) {
            const relationshipPatterns = await this.detectRelationshipPatterns(userId);
            patterns.push(...relationshipPatterns);
        }

        if (privacy.enableProductivityPatterns) {
            const productivityPatterns = await this.detectProductivityPatterns(userId);
            patterns.push(...productivityPatterns);
        }

        if (privacy.enableSocialPatterns) {
            const socialPatterns = await this.detectSocialPatterns(userId);
            patterns.push(...socialPatterns);
        }

        // Save detected patterns to database
        const savedPatterns = [];
        for (const pattern of patterns) {
            const saved = await this.savePattern(userId, pattern);
            savedPatterns.push(saved);
        }

        return savedPatterns;
    }

    /**
     * Detect career patterns (job changes, career cycles)
     */
    static async detectCareerPatterns(userId: string): Promise<DetectedPattern[]> {
        const patterns: DetectedPattern[] = [];

        // Get biography events related to career
        const careerEvents = await prisma.biographyEvent.findMany({
            where: {
                biography: { userId },
                OR: [
                    { category: 'CAREER' },
                    { title: { contains: 'job', mode: 'insensitive' } },
                    { title: { contains: 'work', mode: 'insensitive' } },
                    { title: { contains: 'career', mode: 'insensitive' } },
                    { title: { contains: 'promotion', mode: 'insensitive' } },
                    { title: { contains: 'hired', mode: 'insensitive' } },
                ],
            },
            orderBy: { date: 'asc' },
        });

        if (careerEvents.length < 2) return patterns;

        // Analyze intervals between career events
        const intervals = [];
        for (let i = 1; i < careerEvents.length; i++) {
            const prevDate = careerEvents[i - 1].date;
            const currentDate = careerEvents[i].date;
            const diffMonths = this.monthsDifference(prevDate, currentDate);
            intervals.push(diffMonths);
        }

        // Check if there's a recurring pattern
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);

        // If standard deviation is low, there's a pattern
        if (stdDev < avgInterval * 0.3 && careerEvents.length >= 3) {
            const frequency = this.inferFrequency(avgInterval);
            const confidenceScore = Math.min(100, 100 - (stdDev / avgInterval) * 100);

            const pattern: DetectedPattern = {
                type: 'CAREER',
                title: `Career transitions approximately every ${Math.round(avgInterval)} months`,
                description: `Analysis of your career history shows a recurring pattern of job changes occurring approximately every ${Math.round(avgInterval)} months.`,
                insights: await this.generateCareerInsights(careerEvents, avgInterval),
                frequency,
                firstOccurrence: careerEvents[0].date,
                lastOccurrence: careerEvents[careerEvents.length - 1].date,
                occurrenceCount: careerEvents.length,
                confidenceScore: Math.round(confidenceScore),
                events: careerEvents.map(e => ({
                    biographyEventId: e.id,
                    eventDate: e.date,
                    relevanceScore: 90,
                    eventSummary: e.title,
                })),
            };

            patterns.push(pattern);
        }

        return patterns;
    }

    /**
     * Detect relationship patterns
     */
    static async detectRelationshipPatterns(userId: string): Promise<DetectedPattern[]> {
        const patterns: DetectedPattern[] = [];

        const relationshipEvents = await prisma.biographyEvent.findMany({
            where: {
                biography: { userId },
                category: 'RELATIONSHIP',
            },
            orderBy: { date: 'asc' },
        });

        if (relationshipEvents.length < 2) return patterns;

        // Simple pattern: count of relationship events
        const pattern: DetectedPattern = {
            type: 'RELATIONSHIP',
            title: `${relationshipEvents.length} significant relationship milestones documented`,
            description: `Your biography contains ${relationshipEvents.length} documented relationship milestones spanning from ${relationshipEvents[0].date.getFullYear()} to ${relationshipEvents[relationshipEvents.length - 1].date.getFullYear()}.`,
            insights: await this.generateRelationshipInsights(relationshipEvents),
            frequency: 'IRREGULAR',
            firstOccurrence: relationshipEvents[0].date,
            lastOccurrence: relationshipEvents[relationshipEvents.length - 1].date,
            occurrenceCount: relationshipEvents.length,
            confidenceScore: 75,
            events: relationshipEvents.map(e => ({
                biographyEventId: e.id,
                eventDate: e.date,
                relevanceScore: 85,
                eventSummary: e.title,
            })),
        };

        patterns.push(pattern);
        return patterns;
    }

    /**
     * Detect productivity patterns
     */
    static async detectProductivityPatterns(userId: string): Promise<DetectedPattern[]> {
        const patterns: DetectedPattern[] = [];

        // Analyze posting frequency from social posts
        const posts = await prisma.socialPost.findMany({
            where: {
                dataSource: {
                    userId,
                },
            },
            orderBy: { timestamp: 'asc' },
        });

        if (posts.length < 10) return patterns;

        // Group posts by month
        const postsByMonth = new Map<string, number>();
        posts.forEach(post => {
            const monthKey = `${post.timestamp.getFullYear()}-${post.timestamp.getMonth() + 1}`;
            postsByMonth.set(monthKey, (postsByMonth.get(monthKey) || 0) + 1);
        });

        const monthlyValues = Array.from(postsByMonth.values());
        const avgPostsPerMonth = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;

        if (avgPostsPerMonth > 5) {
            const pattern: DetectedPattern = {
                type: 'PRODUCTIVITY',
                title: `Consistent content creation: ~${Math.round(avgPostsPerMonth)} posts/month`,
                description: `You maintain a consistent content creation rhythm with an average of ${Math.round(avgPostsPerMonth)} posts per month.`,
                insights: await this.generateProductivityInsights(posts, avgPostsPerMonth),
                frequency: 'MONTHLY',
                firstOccurrence: posts[0].timestamp,
                lastOccurrence: posts[posts.length - 1].timestamp,
                occurrenceCount: posts.length,
                confidenceScore: 80,
                events: [],
            };

            patterns.push(pattern);
        }

        return patterns;
    }

    /**
     * Detect social patterns
     */
    static async detectSocialPatterns(userId: string): Promise<DetectedPattern[]> {
        // Implementation similar to above
        return [];
    }

    /**
     * Save pattern to database
     */
    private static async savePattern(userId: string, pattern: DetectedPattern) {
        const savedPattern = await prisma.pattern.create({
            data: {
                userId,
                type: pattern.type,
                title: pattern.title,
                description: pattern.description,
                insights: pattern.insights,
                recommendations: pattern.recommendations,
                firstOccurrence: pattern.firstOccurrence,
                lastOccurrence: pattern.lastOccurrence,
                frequency: pattern.frequency,
                occurrenceCount: pattern.occurrenceCount,
                confidenceScore: pattern.confidenceScore,
                isPremiumFeature: true,
                isPrivate: true,
            },
        });

        // Create pattern events
        for (const event of pattern.events) {
            await prisma.patternEvent.create({
                data: {
                    patternId: savedPattern.id,
                    biographyEventId: event.biographyEventId,
                    eventDate: event.eventDate,
                    relevanceScore: event.relevanceScore,
                    eventSummary: event.eventSummary,
                },
            });
        }

        return savedPattern;
    }

    /**
     * Generate AI insights for career patterns
     */
    private static async generateCareerInsights(events: any[], avgInterval: number): Promise<string> {
        const eventSummary = events.map(e => `${e.date.getFullYear()}: ${e.title}`).join('\n');

        const prompt = `Based on these career events:
${eventSummary}

The pattern shows career transitions approximately every ${Math.round(avgInterval)} months.

Generate 2-3 sentences of insightful analysis about this career pattern. Focus on:
1. What this pattern suggests about the person's career approach
2. Potential reasons for this timing
3. Implications for future career planning

Keep it thoughtful and personalized.`;

        try {
            const insights = await AIService.generateText(prompt);
            return insights.trim();
        } catch (error) {
            return `This pattern suggests a career cycle of approximately ${Math.round(avgInterval)} months, which may indicate periodic reassessment of career goals or natural project/role cycles.`;
        }
    }

    /**
     * Generate insights for relationship patterns
     */
    private static async generateRelationshipInsights(events: any[]): Promise<string> {
        const prompt = `Analyze these relationship milestones and provide 2-3 sentences of thoughtful insights:
${events.map(e => `${e.date.getFullYear()}: ${e.title}`).join('\n')}`;

        try {
            const insights = await AIService.generateText(prompt);
            return insights.trim();
        } catch (error) {
            return `Your relationship journey shows ${events.length} significant milestones, reflecting important connections and transitions in your personal life.`;
        }
    }

    /**
     * Generate productivity insights
     */
    private static async generateProductivityInsights(posts: any[], avgPostsPerMonth: number): Promise<string> {
        return `Your content creation shows remarkable consistency with an average of ${Math.round(avgPostsPerMonth)} posts per month. This sustained engagement demonstrates strong communication habits and thought leadership.`;
    }

    /**
     * Get or create privacy settings
     */
    private static async getOrCreatePrivacy(userId: string) {
        let privacy = await prisma.patternPrivacy.findUnique({
            where: { userId },
        });

        if (!privacy) {
            privacy = await prisma.patternPrivacy.create({
                data: { userId },
            });
        }

        return privacy;
    }

    /**
     * Calculate months difference between dates
     */
    private static monthsDifference(date1: Date, date2: Date): number {
        return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
    }

    /**
     * Infer frequency from average interval in months
     */
    private static inferFrequency(months: number): PatternFrequency {
        if (months < 1) return 'WEEKLY';
        if (months < 3) return 'MONTHLY';
        if (months < 6) return 'QUARTERLY';
        if (months < 18) return 'YEARLY';
        return 'IRREGULAR';
    }

    /**
     * Get user's patterns
     */
    static async getUserPatterns(userId: string, typeFilter?: PatternType) {
        const where: any = { userId };
        if (typeFilter) {
            where.type = typeFilter;
        }

        return await prisma.pattern.findMany({
            where,
            include: {
                events: {
                    include: {
                        biographyEvent: true,
                    },
                },
            },
            orderBy: { confidenceScore: 'desc' },
        });
    }

    /**
     * Delete/hide a pattern
     */
    static async deletePattern(patternId: string, userId: string) {
        const pattern = await prisma.pattern.findUnique({
            where: { id: patternId },
        });

        if (!pattern || pattern.userId !== userId) {
            throw new Error('Pattern not found or unauthorized');
        }

        await prisma.pattern.delete({
            where: { id: patternId },
        });
    }

    /**
     * Provide feedback on a pattern
     */
    static async provideFeedback(patternId: string, userId: string, feedback: string, notes?: string) {
        const pattern = await prisma.pattern.findUnique({
            where: { id: patternId },
        });

        if (!pattern || pattern.userId !== userId) {
            throw new Error('Pattern not found or unauthorized');
        }

        await prisma.pattern.update({
            where: { id: patternId },
            data: {
                userFeedback: feedback,
                feedbackNotes: notes,
                isValidated: feedback === 'HELPFUL',
            },
        });
    }
}
