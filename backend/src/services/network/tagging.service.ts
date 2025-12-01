import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class TaggingService {
    /**
     * Tag a user in an event
     */
    async tagUser(
        taggerId: string,
        taggedUserEmail: string,
        eventData: {
            eventId: string;
            eventTitle: string;
            eventDate: Date;
            message?: string;
        }
    ): Promise<any> {
        // Find tagged user
        let taggedUser = await prisma.user.findUnique({
            where: { email: taggedUserEmail },
        });

        // If user doesn't exist, create invitation record
        if (!taggedUser) {
            logger.info(`User ${taggedUserEmail} not found - invitation needed`);

            // Send invitation email
            await this.sendTagInvitation(taggerId, taggedUserEmail, eventData);

            return {
                success: true,
                status: 'invitation_sent',
                message: `Invitation sent to ${taggedUserEmail}`,
            };
        }

        // Create tag
        const tag = await prisma.eventTag.create({
            data: {
                eventId: eventData.eventId,
                eventTitle: eventData.eventTitle,
                eventDate: eventData.eventDate,
                taggerId,
                taggedUserId: taggedUser.id,
                message: eventData.message,
                status: 'pending',
            },
        });

        // Send notification to tagged user
        await this.sendTagNotification(tag.id);

        return tag;
    }

    /**
     * Verify/accept a tag
     */
    async verifyTag(
        tagId: string,
        taggedUserId: string,
        verificationData: {
            perspective: string;
            photos?: string[];
            details?: string;
        }
    ): Promise<any> {
        const tag = await prisma.eventTag.findUnique({
            where: { id: tagId },
        });

        if (!tag || tag.taggedUserId !== taggedUserId) {
            throw new Error('Tag not found or unauthorized');
        }

        const updatedTag = await prisma.eventTag.update({
            where: { id: tagId },
            data: {
                status: 'accepted',
                verifiedAt: new Date(),
                taggedUserPerspective: verificationData.perspective,
                verificationData: JSON.stringify(verificationData),
            },
        });

        // Update memory completeness score
        await this.updateMemoryCompleteness(taggedUserId);

        // Create/strengthen connection
        const { connectionService } = await import('./connection.service');
        await connectionService.createOrUpdateConnection(tag.taggerId, taggedUserId);

        return updatedTag;
    }

    /**
     * Decline a tag
     */
    async declineTag(tagId: string, taggedUserId: string): Promise<any> {
        const tag = await prisma.eventTag.findUnique({
            where: { id: tagId },
        });

        if (!tag || tag.taggedUserId !== taggedUserId) {
            throw new Error('Tag not found or unauthorized');
        }

        return prisma.eventTag.update({
            where: { id: tagId },
            data: { status: 'declined' },
        });
    }

    /**
     * Get pending tags for user
     */
    async getPendingTags(userId: string): Promise<any[]> {
        return prisma.eventTag.findMany({
            where: {
                taggedUserId: userId,
                status: 'pending',
            },
            include: {
                tagger: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get all tags for a user (made and received)
     */
    async getUserTags(userId: string): Promise<any> {
        const [tagsMade, tagsReceived] = await Promise.all([
            prisma.eventTag.findMany({
                where: { taggerId: userId },
                include: {
                    taggedUser: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.eventTag.findMany({
                where: { taggedUserId: userId },
                include: {
                    tagger: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            tagsMade,
            tagsReceived,
            totalTags: tagsMade.length + tagsReceived.length,
        };
    }

    /**
     * Calculate and update memory completeness score
     */
    private async updateMemoryCompleteness(userId: string): Promise<void> {
        const totalTags = await prisma.eventTag.count({
            where: { taggedUserId: userId },
        });

        const verifiedTags = await prisma.eventTag.count({
            where: {
                taggedUserId: userId,
                status: 'accepted',
            },
        });

        const completenessScore = totalTags > 0
            ? (verifiedTags / totalTags) * 100
            : 0;

        await prisma.user.update({
            where: { id: userId },
            data: { memoryCompleteness: completenessScore },
        });
    }

    /**
     * Send tag invitation email
     */
    private async sendTagInvitation(
        taggerId: string,
        email: string,
        eventData: any
    ): Promise<void> {
        const tagger = await prisma.user.findUnique({ where: { id: taggerId } });

        const inviteLink = `${process.env.FRONTEND_URL}/register?invite=tag&from=${taggerId}&event=${eventData.eventId}`;

        // TODO: Implement email service integration
        logger.info(`Tag invitation email would be sent to ${email}`, {
            from: tagger?.name || tagger?.email,
            event: eventData.eventTitle,
            link: inviteLink,
        });
    }

    /**
     * Send tag notification
     */
    private async sendTagNotification(tagId: string): Promise<void> {
        const tag = await prisma.eventTag.findUnique({
            where: { id: tagId },
            include: {
                tagger: true,
                taggedUser: true,
            },
        });

        if (!tag) return;

        // TODO: Implement notification service (push notifications, in-app, email)
        logger.info(`Tag notification would be sent`, {
            tagId,
            to: tag.taggedUser.email,
            from: tag.tagger.name || tag.tagger.email,
            event: tag.eventTitle,
        });
    }
}

export const taggingService = new TaggingService();
