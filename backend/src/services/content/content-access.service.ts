import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

/**
 * Content access management service
 */
export class ContentAccessService {
    /**
     * Set access level for a chapter
     */
    async setChapterAccess(
        chapterId: string,
        creatorId: string,
        accessLevel: 'public' | 'private' | 'bronze' | 'gold'
    ): Promise<void> {
        try {
            await prisma.contentAccess.upsert({
                where: { chapterId },
                update: {
                    accessLevel,
                    updatedAt: new Date(),
                },
                create: {
                    chapterId,
                    creatorId,
                    accessLevel,
                },
            });

            logger.info(`Chapter ${chapterId} access set to ${accessLevel}`);
        } catch (error: any) {
            logger.error('Error setting chapter access:', error);
            throw error;
        }
    }

    /**
     * Get chapter access level
     */
    async getChapterAccess(chapterId: string): Promise<string> {
        try {
            const access = await prisma.contentAccess.findUnique({
                where: { chapterId },
            });

            return access?.accessLevel || 'public';
        } catch (error: any) {
            logger.error('Error getting chapter access:', error);
            return 'public';
        }
    }

    /**
     * Get accessible chapters for a user
     */
    async getAccessibleChapters(
        userId: string,
        creatorId: string,
        chapterIds: string[]
    ): Promise<string[]> {
        try {
            // Get user's subscription tier
            const subscription = await prisma.subscription.findUnique({
                where: {
                    subscriberId_creatorId: {
                        subscriberId: userId,
                        creatorId,
                    },
                },
                include: { tier: true },
            });

            // Get all chapter access levels
            const accessLevels = await prisma.contentAccess.findMany({
                where: {
                    chapterId: { in: chapterIds },
                },
            });

            // Determine user's access level
            let userAccessLevel = 0; // public
            if (subscription && subscription.status === 'active') {
                const tierMap: Record<string, number> = {
                    'Free': 0,
                    'Bronze': 1,
                    'Gold': 2,
                };
                userAccessLevel = tierMap[subscription.tier.name] || 0;
            }

            // Filter accessible chapters
            const accessibleChapterIds = chapterIds.filter((chapterId) => {
                const access = accessLevels.find((a: any) => a.chapterId === chapterId);
                if (!access) return true; // Default to public

                const levelMap: Record<string, number> = {
                    'public': 0,
                    'private': 999, // Never accessible via subscription
                    'bronze': 1,
                    'gold': 2,
                };

                const requiredLevel = levelMap[access.accessLevel] || 0;
                return userAccessLevel >= requiredLevel;
            });

            return accessibleChapterIds;
        } catch (error: any) {
            logger.error('Error getting accessible chapters:', error);
            return [];
        }
    }

    /**
     * Get preview content (first 500 characters)
     */
    getPreviewContent(fullContent: string, maxLength: number = 500): string {
        if (fullContent.length <= maxLength) {
            return fullContent;
        }

        // Try to cut at a sentence boundary
        const preview = fullContent.substring(0, maxLength);
        const lastPeriod = preview.lastIndexOf('.');
        const lastExclamation = preview.lastIndexOf('!');
        const lastQuestion = preview.lastIndexOf('?');

        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

        if (lastSentenceEnd > maxLength * 0.7) {
            return preview.substring(0, lastSentenceEnd + 1) + '...';
        }

        // Cut at last space
        const lastSpace = preview.lastIndexOf(' ');
        if (lastSpace > 0) {
            return preview.substring(0, lastSpace) + '...';
        }

        return preview + '...';
    }

    /**
     * Check if user can access specific chapter
     */
    async canAccessChapter(
        userId: string,
        creatorId: string,
        chapterId: string
    ): Promise<boolean> {
        try {
            // Creator always has access
            if (userId === creatorId) {
                return true;
            }

            const accessibleChapters = await this.getAccessibleChapters(
                userId,
                creatorId,
                [chapterId]
            );

            return accessibleChapters.includes(chapterId);
        } catch (error: any) {
            logger.error('Error checking chapter access:', error);
            return false;
        }
    }

    /**
     * Bulk set access levels for chapters
     */
    async bulkSetChapterAccess(
        chapters: Array<{ chapterId: string; accessLevel: string }>,
        creatorId: string
    ): Promise<void> {
        try {
            const operations = chapters.map((chapter) =>
                prisma.contentAccess.upsert({
                    where: { chapterId: chapter.chapterId },
                    update: {
                        accessLevel: chapter.accessLevel,
                        updatedAt: new Date(),
                    },
                    create: {
                        chapterId: chapter.chapterId,
                        creatorId,
                        accessLevel: chapter.accessLevel,
                    },
                })
            );

            await Promise.all(operations);
            logger.info(`Bulk updated access for ${chapters.length} chapters`);
        } catch (error: any) {
            logger.error('Error bulk setting chapter access:', error);
            throw error;
        }
    }

    /**
     * Get all chapters with their access levels for a creator
     */
    async getCreatorChapterAccess(creatorId: string): Promise<any[]> {
        try {
            return await prisma.contentAccess.findMany({
                where: { creatorId },
                orderBy: { createdAt: 'desc' },
            });
        } catch (error: any) {
            logger.error('Error getting creator chapter access:', error);
            return [];
        }
    }
}

export const contentAccessService = new ContentAccessService();
