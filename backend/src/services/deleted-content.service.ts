import prisma from '../db/prisma';
import { DeletionReason } from '@prisma/client';

/**
 * Service for tracking deleted content for Shadow Self analysis
 * Hooks into all delete operations to snapshot content before deletion
 */
export class DeletedContentService {
    /**
     * Track content deletion (called before delete)
     */
    static async trackDeletion(
        userId: string,
        contentType: string,
        contentId: string,
        originalData: any,
        reason?: DeletionReason,
        userNotes?: string
    ) {
        // Check if user has Platinum subscription
        const hasPlatin um = await this.userHasPlatinum(userId);

        if (!hasPlatin um) {
            // Don't track deletions for non-Platinum users (GDPR compliance)
            return null;
        }

        // Create content summary for AI categorization
        const contentSummary = await this.generateContentSummary(originalData, contentType);

        // Detect theme and emotional tone using AI
        const { theme, emotion } = await this.detectThemeAndEmotion(contentSummary);

        const deletedContent = await prisma.deletedContent.create({
            data: {
                userId,
                contentType,
                contentId,
                originalData,
                contentSummary,
                deletionReason: reason,
                userNotes,
                detectedTheme: theme,
                emotionalTone: emotion,
                showInShadowSelf: true,
                canRecover: true,
                // Auto-delete after 90 days for GDPR compliance
                permanentlyDeletedAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            },
        });

        return deletedContent;
    }

    /**
     * Get all deleted content for a user
     */
    static async getUserDeletedContent(userId: string, includeExpired: boolean = false) {
        const where: any = { userId };

        if (!includeExpired) {
            where.permanentlyDeletedAt = { gte: new Date() }; // Not yet permanently deleted
        }

        return await prisma.deletedContent.findMany({
            where,
            orderBy: { deletedAt: 'desc' },
        });
    }

    /**
     * Get deleted content by theme/category
     */
    static async getByTheme(userId: string, theme: string) {
        return await prisma.deletedContent.findMany({
            where: {
                userId,
                detectedTheme: theme,
                showInShadowSelf: true,
                permanentlyDeletedAt: { gte: new Date() },
            },
            orderBy: { deletedAt: 'desc' },
        });
    }

    /**
     * Analyze deletion patterns
     */
    static async analyzeDeletionPatterns(userId: string) {
        const deletedContent = await this.getUserDeletedContent(userId);

        // Group by theme
        const themeGroups = new Map<string, any[]>();
        deletedContent.forEach(item => {
            const theme = item.detectedTheme || 'uncategorized';
            if (!themeGroups.has(theme)) {
                themeGroups.set(theme, []);
            }
            themeGroups.get(theme)!.push(item);
        });

        // Group by emotional tone
        const emotionGroups = new Map<string, any[]>();
        deletedContent.forEach(item => {
            const emotion = item.emotionalTone || 'neutral';
            if (!emotionGroups.has(emotion)) {
                emotionGroups.set(emotion, []);
            }
            emotionGroups.get(emotion)!.push(item);
        });

        // Calculate deletion frequency over time
        const deletionsByMonth = new Map<string, number>();
        deletedContent.forEach(item => {
            const monthKey = `${item.deletedAt.getFullYear()}-${item.deletedAt.getMonth() + 1}`;
            deletionsByMonth.set(monthKey, (deletionsByMonth.get(monthKey) || 0) + 1);
        });

        return {
            totalDeleted: deletedContent.length,
            themeBreakdown: Array.from(themeGroups.entries()).map(([theme, items]) => ({
                theme,
                count: items.length,
                percentage: (items.length / deletedContent.length) * 100,
            })),
            emotionalBreakdown: Array.from(emotionGroups.entries()).map(([emotion, items]) => ({
                emotion,
                count: items.length,
                percentage: (items.length / deletedContent.length) * 100,
            })),
            deletionFrequency: Array.from(deletionsByMonth.entries()).map(([month, count]) => ({
                month,
                count,
            })),
            mostDeletedTheme: Array.from(themeGroups.entries()).sort((a, b) => b[1].length - a[1].length)[0]?.[0],
            dominantEmotion: Array.from(emotionGroups.entries()).sort((a, b) => b[1].length - a[1].length)[0]?.[0],
        };
    }

    /**
     * Compare public vs private content
     */
    static async comparePublicPrivate(userId: string) {
        // Get all public events
        const publicEvents = await prisma.biographyEvent.findMany({
            where: {
                biography: { userId },
                isPublic: true,
            },
        });

        // Get all events (including private)
        const allEvents = await prisma.biographyEvent.findMany({
            where: {
                biography: { userId },
            },
        });

        // Get deleted content
        const deletedContent = await this.getUserDeletedContent(userId);

        const totalContent = allEvents.length + deletedContent.length;
        const publicContent = publicEvents.length;
        const hiddenContent = allEvents.length - publicEvents.length + deletedContent.length;

        const publicPrivateGap = totalContent > 0 ? (hiddenContent / totalContent) * 100 : 0;

        return {
            publicCount: publicContent,
            privateCount: allEvents.length - publicEvents.length,
            deletedCount: deletedContent.length,
            totalCount: totalContent,
            hiddenCount: hiddenContent,
            publicPrivateGap: Math.round(publicPrivateGap),
            publicPercentage: Math.round((publicContent / totalContent) * 100),
            hiddenPercentage: Math.round((hiddenContent / totalContent) * 100),
        };
    }

    /**
     * Permanently delete expired content (GDPR compliance)
     * Run this as a daily cron job
     */
    static async purgeExpiredContent() {
        const now = new Date();

        const result = await prisma.deletedContent.deleteMany({
            where: {
                permanentlyDeletedAt: { lte: now },
            },
        });

        console.log(`Purged ${result.count} expired deleted content items (GDPR compliance)`);
        return result.count;
    }

    /**
     * Recover deleted content (if within 90-day window)
     */
    static async recoverContent(deletedContentId: string, userId: string) {
        const deletedItem = await prisma.deletedContent.findUnique({
            where: { id: deletedContentId },
        });

        if (!deletedItem || deletedItem.userId !== userId) {
            throw new Error('Deleted content not found or unauthorized');
        }

        if (deletedItem.permanentlyDeletedAt && deletedItem.permanentlyDeletedAt < new Date()) {
            throw new Error('Content has been permanently deleted (GDPR 90-day window expired)');
        }

        if (!deletedItem.canRecover) {
            throw new Error('Content cannot be recovered');
        }

        // Mark as recovered
        await prisma.deletedContent.update({
            where: { id: deletedContentId },
            data: {
                recoveredAt: new Date(),
                showInShadowSelf: false, // Don't show in future reports
            },
        });

        return deletedItem.originalData;
    }

    /**
     * Generate content summary for deleted item
     */
    private static async generateContentSummary(originalData: any, contentType: string): Promise<string> {
        switch (contentType) {
            case 'BIOGRAPHY_EVENT':
                return `${originalData.title || 'Untitled Event'}: ${originalData.description?.substring(0, 100) || ''}`;
            case 'CHAPTER':
                return `Chapter: ${originalData.title || 'Untitled'} (${originalData.wordCount || 0} words)`;
            case 'SOCIAL_POST':
                return `Post: ${originalData.content?.substring(0, 150) || ''}`;
            default:
                return JSON.stringify(originalData).substring(0, 200);
        }
    }

    /**
     * Detect theme and emotional tone using AI
     */
    private static async detectThemeAndEmotion(contentSummary: string): Promise<{ theme: string; emotion: string }> {
        // AI categorization would go here
        // For now, simple keyword detection

        const lowerContent = contentSummary.toLowerCase();

        // Detect theme
        let theme = 'general';
        if (lowerContent.includes('job') || lowerContent.includes('career') || lowerContent.includes('work')) {
            theme = 'career';
        } else if (lowerContent.includes('relationship') || lowerContent.includes('love') || lowerContent.includes('partner')) {
            theme = 'relationship';
        } else if (lowerContent.includes('health') || lowerContent.includes('medical') || lowerContent.includes('illness')) {
            theme = 'health';
        } else if (lowerContent.includes('money') || lowerContent.includes('financial') || lowerContent.includes('debt')) {
            theme = 'financial';
        }

        // Detect emotion
        let emotion = 'neutral';
        if (lowerContent.includes('regret') || lowerContent.includes('mistake') || lowerContent.includes('sorry')) {
            emotion = 'regret';
        } else if (lowerContent.includes('shame') || lowerContent.includes('embarrass') || lowerContent.includes('humiliat')) {
            emotion = 'shame';
        } else if (lowerContent.includes('fear') || lowerContent.includes('afraid') || lowerContent.includes('worried')) {
            emotion = 'fear';
        } else if (lowerContent.includes('protect') || lowerContent.includes('privacy') || lowerContent.includes('hide')) {
            emotion = 'protection';
        }

        return { theme, emotion };
    }

    /**
     * Check if user has Platinum subscription
     */
    private static async userHasPlatinum(userId: string): Promise<boolean> {
        const subscription = await prisma.platinumSubscription.findUnique({
            where: { userId },
        });

        return subscription?.status === 'ACTIVE';
    }
}
