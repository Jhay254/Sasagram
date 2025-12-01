"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentAccessService = exports.ContentAccessService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Content access management service
 */
class ContentAccessService {
    /**
     * Set access level for a chapter
     */
    async setChapterAccess(chapterId, creatorId, accessLevel) {
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
            logger_1.logger.info(`Chapter ${chapterId} access set to ${accessLevel}`);
        }
        catch (error) {
            logger_1.logger.error('Error setting chapter access:', error);
            throw error;
        }
    }
    /**
     * Get chapter access level
     */
    async getChapterAccess(chapterId) {
        try {
            const access = await prisma.contentAccess.findUnique({
                where: { chapterId },
            });
            return access?.accessLevel || 'public';
        }
        catch (error) {
            logger_1.logger.error('Error getting chapter access:', error);
            return 'public';
        }
    }
    /**
     * Get accessible chapters for a user
     */
    async getAccessibleChapters(userId, creatorId, chapterIds) {
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
                const tierMap = {
                    'Free': 0,
                    'Bronze': 1,
                    'Gold': 2,
                };
                userAccessLevel = tierMap[subscription.tier.name] || 0;
            }
            // Filter accessible chapters
            const accessibleChapterIds = chapterIds.filter((chapterId) => {
                const access = accessLevels.find((a) => a.chapterId === chapterId);
                if (!access)
                    return true; // Default to public
                const levelMap = {
                    'public': 0,
                    'private': 999, // Never accessible via subscription
                    'bronze': 1,
                    'gold': 2,
                };
                const requiredLevel = levelMap[access.accessLevel] || 0;
                return userAccessLevel >= requiredLevel;
            });
            return accessibleChapterIds;
        }
        catch (error) {
            logger_1.logger.error('Error getting accessible chapters:', error);
            return [];
        }
    }
    /**
     * Get preview content (first 500 characters)
     */
    getPreviewContent(fullContent, maxLength = 500) {
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
    async canAccessChapter(userId, creatorId, chapterId) {
        try {
            // Creator always has access
            if (userId === creatorId) {
                return true;
            }
            const accessibleChapters = await this.getAccessibleChapters(userId, creatorId, [chapterId]);
            return accessibleChapters.includes(chapterId);
        }
        catch (error) {
            logger_1.logger.error('Error checking chapter access:', error);
            return false;
        }
    }
    /**
     * Bulk set access levels for chapters
     */
    async bulkSetChapterAccess(chapters, creatorId) {
        try {
            const operations = chapters.map((chapter) => prisma.contentAccess.upsert({
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
            }));
            await Promise.all(operations);
            logger_1.logger.info(`Bulk updated access for ${chapters.length} chapters`);
        }
        catch (error) {
            logger_1.logger.error('Error bulk setting chapter access:', error);
            throw error;
        }
    }
    /**
     * Get all chapters with their access levels for a creator
     */
    async getCreatorChapterAccess(creatorId) {
        try {
            return await prisma.contentAccess.findMany({
                where: { creatorId },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting creator chapter access:', error);
            return [];
        }
    }
}
exports.ContentAccessService = ContentAccessService;
exports.contentAccessService = new ContentAccessService();
