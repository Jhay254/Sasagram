import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

interface CompletionSignal {
    type: 'job_change' | 'location_change' | 'relationship_milestone' | 'manual';
    confidence: number; // 0-100
    details: string;
    detectedAt: Date;
}

export class ChapterAIService {
    /**
     * Analyze user activity for chapter completion signals
     */
    async detectCompletion(userId: string): Promise<CompletionSignal | null> {
        // Get active chapter
        const activeChapter = await prisma.livingChapter.findFirst({
            where: {
                userId,
                status: 'active',
            },
        });

        if (!activeChapter) return null;

        // 1. Check for Job Changes (Heuristic: "new job" in recent posts)
        const jobSignal = await this.detectJobChange(userId, activeChapter.startDate);
        if (jobSignal) return jobSignal;

        // 2. Check for Location Changes (Heuristic: significant GPS shift)
        const locationSignal = await this.detectLocationChange(userId, activeChapter.startDate);
        if (locationSignal) return locationSignal;

        // 3. Check for Relationship Milestones (Heuristic: status change)
        const relationshipSignal = await this.detectRelationshipChange(userId, activeChapter.startDate);
        if (relationshipSignal) return relationshipSignal;

        return null;
    }

    /**
     * Suggest a title for the next chapter
     */
    async suggestNewChapter(userId: string): Promise<string> {
        // Simple heuristic for now
        const year = new Date().getFullYear();
        return `The ${year} Era`;
    }

    /**
     * Detect job changes based on feed content
     */
    private async detectJobChange(userId: string, since: Date): Promise<CompletionSignal | null> {
        const recentPosts = await prisma.livingFeedEntry.findMany({
            where: {
                userId,
                timestamp: { gte: since },
            },
            orderBy: { timestamp: 'desc' },
            take: 50,
        });

        const jobKeywords = ['new job', 'started at', 'hired', 'promotion', 'left my job'];

        for (const post of recentPosts) {
            const content = post.content.toLowerCase();
            if (jobKeywords.some(keyword => content.includes(keyword))) {
                return {
                    type: 'job_change',
                    confidence: 85,
                    details: `Detected career update in post from ${post.timestamp.toLocaleDateString()}`,
                    detectedAt: new Date(),
                };
            }
        }

        return null;
    }

    /**
     * Detect significant location changes
     */
    private async detectLocationChange(userId: string, since: Date): Promise<CompletionSignal | null> {
        // Placeholder: In a real app, we'd analyze GPS logs
        // For now, check if "moved to" is in feed
        const recentPosts = await prisma.livingFeedEntry.findMany({
            where: {
                userId,
                timestamp: { gte: since },
            },
            orderBy: { timestamp: 'desc' },
            take: 20,
        });

        for (const post of recentPosts) {
            if (post.content.toLowerCase().includes('moved to')) {
                return {
                    type: 'location_change',
                    confidence: 90,
                    details: `Detected move in post from ${post.timestamp.toLocaleDateString()}`,
                    detectedAt: new Date(),
                };
            }
        }

        return null;
    }

    /**
     * Detect relationship status changes
     */
    private async detectRelationshipChange(userId: string, since: Date): Promise<CompletionSignal | null> {
        // Placeholder: Check for "engaged", "married", "single" keywords
        const recentPosts = await prisma.livingFeedEntry.findMany({
            where: {
                userId,
                timestamp: { gte: since },
            },
            orderBy: { timestamp: 'desc' },
            take: 20,
        });

        const relationshipKeywords = ['engaged', 'married', 'breakup', 'divorced'];

        for (const post of recentPosts) {
            const content = post.content.toLowerCase();
            if (relationshipKeywords.some(k => content.includes(k))) {
                return {
                    type: 'relationship_milestone',
                    confidence: 80,
                    details: `Detected relationship update in post from ${post.timestamp.toLocaleDateString()}`,
                    detectedAt: new Date(),
                };
            }
        }

        return null;
    }
}

export const chapterAIService = new ChapterAIService();
