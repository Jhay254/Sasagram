import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';
import { notificationService } from '../notification.service';
import { inviteService } from '../invite.service';

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
        try {
            return await prisma.eventTag.findMany({
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
        } catch (error) {
            logger.error('Error in getPendingTags:', error);
            throw error;
        }
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
        // Generate invite token
        const inviteToken = inviteService.generateInviteToken('pending', email);

        // Send invitation email
        await notificationService.sendInviteNotification(
            taggerId,
            email,
            eventData,
            inviteToken
        );

        logger.info(`Tag invitation sent to ${email}`, {
            taggerId,
            event: eventData.eventTitle,
        });
    }

    /**
     * Send tag notification
     */
    private async sendTagNotification(tagId: string): Promise<void> {
        await notificationService.sendTagNotification(tagId);
    }
}

export const taggingService = new TaggingService();
