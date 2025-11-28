import prisma from '../db/prisma';
import { TagStatus } from '@prisma/client';

interface TagData {
    taggerId: string;
    eventId?: string;
    chapterId?: string;
    taggedEmail?: string;
    taggedUserId?: string;
    taggedName?: string;
    message?: string;
}

interface PerspectiveData {
    text?: string;
    photoUrls?: string[];
    audioUrl?: string;
    videoUrl?: string;
    visibility?: string;
}

export class TaggingService {
    // Tag creation limits
    private static readonly MAX_TAGS_PER_EVENT = 10;
    private static readonly MAX_TAGS_PER_MONTH = 50;

    /**
     * Create a new event tag
     */
    static async createTag(data: TagData): Promise<string> {
        const { taggerId, eventId, chapterId, taggedEmail, taggedUserId, taggedName, message } = data;

        // Validate: must have either eventId or chapterId
        if (!eventId && !chapterId) {
            throw new Error('Either eventId or chapterId must be provided');
        }

        // Validate: must have either taggedEmail or taggedUserId
        if (!taggedEmail && !taggedUserId) {
            throw new Error('Either taggedEmail or taggedUserId must be provided');
        }

        // Check monthly limit
        const monthlyCount = await this.getMonthlyTagCount(taggerId);
        if (monthlyCount >= this.MAX_TAGS_PER_MONTH) {
            throw new Error(`Monthly tag limit reached (${this.MAX_TAGS_PER_MONTH})`);
        }

        // Check per-event limit
        if (eventId) {
            const eventTagCount = await prisma.eventTag.count({
                where: { biographyEventId: eventId },
            });
            if (eventTagCount >= this.MAX_TAGS_PER_EVENT) {
                throw new Error(`Event tag limit reached (${this.MAX_TAGS_PER_EVENT})`);
            }
        }

        // If email provided, check if user exists
        let finalTaggedUserId = taggedUserId;
        if (taggedEmail && !taggedUserId) {
            const existingUser = await prisma.user.findUnique({
                where: { email: taggedEmail },
                select: { id: true },
            });
            finalTaggedUserId = existingUser?.id;
        }

        // Create tag
        const tag = await prisma.eventTag.create({
            data: {
                taggerId,
                biographyEventId: eventId,
                chapterId,
                taggedUserId: finalTaggedUserId,
                taggedEmail: taggedEmail,
                taggedName: taggedName,
                message,
                status: TagStatus.PENDING,
            },
        });

        // Send notification
        await this.sendTagNotification(tag.id);

        return tag.id;
    }

    /**
     * Tag multiple users at once
     */
    static async tagMultipleUsers(
        taggerId: string,
        eventId: string,
        users: Array<{ email?: string; userId?: string; name?: string; message?: string }>
    ): Promise<string[]> {
        const tagIds: string[] = [];

        for (const user of users) {
            try {
                const tagId = await this.createTag({
                    taggerId,
                    eventId,
                    taggedEmail: user.email,
                    taggedUserId: user.userId,
                    taggedName: user.name,
                    message: user.message,
                });
                tagIds.push(tagId);
            } catch (error) {
                console.error(`Failed to tag user:`, error);
                // Continue with other tags
            }
        }

        return tagIds;
    }

    /**
     * Verify a tag (user confirms they were there)
     */
    static async verifyTag(tagId: string, userId: string): Promise<void> {
        const tag = await prisma.eventTag.findUnique({
            where: { id: tagId },
        });

        if (!tag) {
            throw new Error('Tag not found');
        }

        // Verify user is the tagged person
        if (tag.taggedUserId !== userId) {
            throw new Error('You are not authorized to verify this tag');
        }

        if (tag.status !== TagStatus.PENDING) {
            throw new Error('Tag has already been verified or declined');
        }

        // Update tag status
        await prisma.eventTag.update({
            where: { id: tagId },
            data: {
                status: TagStatus.VERIFIED,
                verifiedAt: new Date(),
            },
        });

        // Update event verification count
        if (tag.biographyEventId) {
            await prisma.biographyEvent.update({
                where: { id: tag.biographyEventId },
                data: {
                    verificationCount: { increment: 1 },
                },
            });
        }

        // Update user's verified tag count
        await prisma.user.update({
            where: { id: userId },
            data: {
                verifiedTagCount: { increment: 1 },
            },
        });

        // Recalculate memory completeness for tagger
        await this.calculateMemoryCompleteness(tag.taggerId);
    }

    /**
     * Add perspective to a verified tag
     */
    static async addPerspective(tagId: string, userId: string, data: PerspectiveData): Promise<string> {
        const tag = await prisma.eventTag.findUnique({
            where: { id: tagId },
            include: { perspective: true },
        });

        if (!tag) {
            throw new Error('Tag not found');
        }

        // Verify user is the tagged person
        if (tag.taggedUserId !== userId) {
            throw new Error('You are not authorized to add perspective to this tag');
        }

        // Tag must be verified first
        if (tag.status !== TagStatus.VERIFIED) {
            throw new Error('Tag must be verified before adding perspective');
        }

        // Check if perspective already exists
        if (tag.perspective) {
            // Update existing perspective
            await prisma.tagPerspective.update({
                where: { id: tag.perspective.id },
                data: {
                    text: data.text,
                    photoUrls: data.photoUrls || tag.perspective.photoUrls,
                    audioUrl: data.audioUrl,
                    videoUrl: data.videoUrl,
                    visibility: data.visibility || tag.perspective.visibility,
                },
            });
            return tag.perspective.id;
        } else {
            // Create new perspective
            const perspective = await prisma.tagPerspective.create({
                data: {
                    tagId,
                    text: data.text,
                    photoUrls: data.photoUrls || [],
                    audioUrl: data.audioUrl,
                    videoUrl: data.videoUrl,
                    visibility: data.visibility || 'PUBLIC',
                },
            });
            return perspective.id;
        }
    }

    /**
     * Decline a tag (user disputes they were there)
     */
    static async declineTag(tagId: string, userId: string, reason?: string): Promise<void> {
        const tag = await prisma.eventTag.findUnique({
            where: { id: tagId },
        });

        if (!tag) {
            throw new Error('Tag not found');
        }

        // Verify user is the tagged person
        if (tag.taggedUserId !== userId) {
            throw new Error('You are not authorized to decline this tag');
        }

        if (tag.status !== TagStatus.PENDING) {
            throw new Error('Tag has already been verified or declined');
        }

        // Update tag status
        await prisma.eventTag.update({
            where: { id: tagId },
            data: {
                status: TagStatus.DECLINED,
                declinedAt: new Date(),
                declineReason: reason,
            },
        });

        // TODO: Flag for review if multiple declines from same tagger
    }

    /**
     * Get all tags for an event
     */
    static async getEventTags(eventId: string) {
        return await prisma.eventTag.findMany({
            where: {
                OR: [
                    { biographyEventId: eventId },
                    { chapterId: eventId }, // Also support chapter ID
                ],
            },
            include: {
                tagger: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                taggedUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                perspective: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get pending tags for a user
     */
    static async getPendingTags(userId: string) {
        return await prisma.eventTag.findMany({
            where: {
                taggedUserId: userId,
                status: TagStatus.PENDING,
            },
            include: {
                tagger: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                biographyEvent: true,
                chapter: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Calculate memory completeness score for a user
     */
    static async calculateMemoryCompleteness(userId: string): Promise<number> {
        // Get all tags created by user
        const tagsCreated = await prisma.eventTag.count({
            where: { taggerId: userId },
        });

        if (tagsCreated === 0) {
            return 0;
        }

        // Get verified tags
        const verifiedTags = await prisma.eventTag.count({
            where: {
                taggerId: userId,
                status: TagStatus.VERIFIED,
            },
        });

        // Get tags with perspectives
        const tagsWithPerspectives = await prisma.eventTag.count({
            where: {
                taggerId: userId,
                status: TagStatus.VERIFIED,
                perspective: { isNot: null },
            },
        });

        // Get tagged users who became creators
        const convertedCreators = await prisma.eventTag.count({
            where: {
                taggerId: userId,
                status: TagStatus.VERIFIED,
                taggedUser: {
                    biography: { isNot: null },
                },
            },
        });

        // Base score: verification rate
        let completeness = (verifiedTags / tagsCreated) * 100;

        // Bonus: +5% for each perspective (up to 20%)
        const perspectiveBonus = Math.min((tagsWithPerspectives / tagsCreated) * 100 * 0.5, 20);
        completeness += perspectiveBonus;

        // Bonus: +10% for each converted creator (up to 30%)
        const conversionBonus = Math.min((convertedCreators / tagsCreated) * 100 * 1.0, 30);
        completeness += conversionBonus;

        // Cap at 100
        completeness = Math.min(completeness, 100);

        // Update user record
        await prisma.user.update({
            where: { id: userId },
            data: { memoryCompleteness: Math.round(completeness * 100) / 100 },
        });

        return completeness;
    }

    /**
     * Get leaderboard for memory completeness
     */
    static async getLeaderboard(limit: number = 50) {
        return await prisma.user.findMany({
            where: {
                memoryCompleteness: { gt: 0 },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
                memoryCompleteness: true,
                verifiedTagCount: true,
            },
            orderBy: { memoryCompleteness: 'desc' },
            take: limit,
        });
    }

    /**
     * Get monthly tag count for rate limiting
     */
    private static async getMonthlyTagCount(userId: string): Promise<number> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        return await prisma.eventTag.count({
            where: {
                taggerId: userId,
                createdAt: { gte: startOfMonth },
            },
        });
    }

    /**
     * Send tag notification (placeholder for notification service integration)
     */
    private static async sendTagNotification(tagId: string): Promise<void> {
        const tag = await prisma.eventTag.findUnique({
            where: { id: tagId },
            include: {
                tagger: true,
                biographyEvent: true,
                chapter: true,
            },
        });

        if (!tag) return;

        // TODO: Integrate with notification service
        // await NotificationService.sendTagNotification(tag);

        // Mark invitation as sent
        await prisma.eventTag.update({
            where: { id: tagId },
            data: { invitationSent: true },
        });
    }

    /**
     * Get verification statistics for an event
     */
    static async getVerificationStats(eventId: string) {
        const tags = await prisma.eventTag.findMany({
            where: { biographyEventId: eventId },
        });

        const verified = tags.filter(t => t.status === TagStatus.VERIFIED).length;
        const pending = tags.filter(t => t.status === TagStatus.PENDING).length;
        const declined = tags.filter(t => t.status === TagStatus.DECLINED).length;
        const withPerspectives = tags.filter(t => t.perspective !== null).length;

        return {
            total: tags.length,
            verified,
            pending,
            declined,
            withPerspectives,
            verificationRate: tags.length > 0 ? (verified / tags.length) * 100 : 0,
        };
    }
}
