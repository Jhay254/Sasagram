import prisma from '../db/prisma';
import { NotificationService } from './notification.service';
import { addDays } from 'date-fns';

/**
 * Collaboration Service - Manage merger invitations and lifecycle
 */
export class CollaborationService {
    /**
     * Send collaboration invitation
     */
    static async sendInvitation(
        senderId: string,
        recipientId: string,
        sharedEventId: string,
        message?: string,
        proposedSplit: number = 0.5
    ) {
        // Validate split ratio
        if (proposedSplit < 0 || proposedSplit > 1) {
            throw new Error('Revenue split must be between 0 and 1');
        }

        // Get sender info
        const sender = await prisma.user.findUnique({
            where: { id: senderId },
            select: { name: true },
        });

        // Create invitation
        const invite = await prisma.collaborationInvite.create({
            data: {
                senderId,
                recipientId,
                sharedEventId,
                message,
                proposedTitle: `Shared Memory Collaboration`,
                proposedSplit,
                expiresAt: addDays(new Date(), 7), // 7 days to respond
                status: 'PENDING',
            },
        });

        // Send notification
        await NotificationService.send(recipientId, {
            type: 'COLLABORATION_INVITE',
            title: `${sender?.name || 'Someone'} wants to create a merged story with you!`,
            body: message || 'Check out this collaboration opportunity',
            data: {
                inviteId: invite.id,
                senderId,
            },
        });

        return invite;
    }

    /**
     * Accept collaboration invitation
     */
    static async acceptInvitation(inviteId: string, recipientId: string, responseMessage?: string) {
        const invite = await prisma.collaborationInvite.findUnique({
            where: { id: inviteId },
        });

        if (!invite) {
            throw new Error('Invitation not found');
        }

        if (invite.recipientId !== recipientId) {
            throw new Error('Unauthorized');
        }

        if (invite.status !== 'PENDING') {
            throw new Error(`Invitation already ${invite.status.toLowerCase()}`);
        }

        if (invite.expiresAt < new Date()) {
            throw new Error('Invitation has expired');
        }

        // Update invitation
        await prisma.collaborationInvite.update({
            where: { id: inviteId },
            data: {
                status: 'ACCEPTED',
                respondedAt: new Date(),
                responseMessage,
            },
        });

        // Notify sender
        await NotificationService.send(invite.senderId, {
            type: 'COLLABORATION_ACCEPTED',
            title: 'Collaboration accepted!',
            body: 'Your collaboration invitation was accepted',
            data: { inviteId },
        });

        return invite;
    }

    /**
     * Decline collaboration invitation
     */
    static async declineInvitation(inviteId: string, recipientId: string, responseMessage?: string) {
        const invite = await prisma.collaborationInvite.findUnique({
            where: { id: inviteId },
        });

        if (!invite) {
            throw new Error('Invitation not found');
        }

        if (invite.recipientId !== recipientId) {
            throw new Error('Unauthorized');
        }

        if (invite.status !== 'PENDING') {
            throw new Error(`Invitation already ${invite.status.toLowerCase()}`);
        }

        // Update invitation
        await prisma.collaborationInvite.update({
            where: { id: inviteId },
            data: {
                status: 'DECLINED',
                respondedAt: new Date(),
                responseMessage,
            },
        });

        // Notify sender
        await NotificationService.send(invite.senderId, {
            type: 'COLLABORATION_DECLINED',
            title: 'Collaboration declined',
            body: responseMessage || 'Your collaboration invitation was declined',
            data: { inviteId },
        });

        return invite;
    }

    /**
     * Cancel sent invitation
     */
    static async cancelInvitation(inviteId: string, senderId: string) {
        const invite = await prisma.collaborationInvite.findUnique({
            where: { id: inviteId },
        });

        if (!invite) {
            throw new Error('Invitation not found');
        }

        if (invite.senderId !== senderId) {
            throw new Error('Unauthorized');
        }

        if (invite.status !== 'PENDING') {
            throw new Error(`Cannot cancel ${invite.status.toLowerCase()} invitation`);
        }

        await prisma.collaborationInvite.update({
            where: { id: inviteId },
            data: { status: 'CANCELLED' },
        });

        return { success: true };
    }

    /**
     * Get user's invitations
     */
    static async getUserInvitations(userId: string, filter?: 'sent' | 'received') {
        const where: any = {
            status: { in: ['PENDING', 'ACCEPTED', 'DECLINED'] },
        };

        if (filter === 'sent') {
            where.senderId = userId;
        } else if (filter === 'received') {
            where.recipientId = userId;
        } else {
            where.OR = [{ senderId: userId }, { recipientId: userId }];
        }

        return await prisma.collaborationInvite.findMany({
            where,
            include: {
                sender: { select: { id: true, name: true, profilePictureUrl: true } },
                recipient: { select: { id: true, name: true, profilePictureUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Auto-expire old invitations (cron job)
     */
    static async expireOldInvitations() {
        const result = await prisma.collaborationInvite.updateMany({
            where: {
                expiresAt: { lte: new Date() },
                status: 'PENDING',
            },
            data: {
                status: 'EXPIRED',
            },
        });

        console.log(`Expired ${result.count} old collaboration invitations`);
        return result.count;
    }

    /**
     * Generate merger suggestions for user (AI-powered)
     */
    static async generateSuggestions(userId: string) {
        // Find shared events from Memory Graph
        const sharedEvents = await prisma.$queryRaw`
      SELECT DISTINCT uc.userAId as otherUserId, uc.sharedEventIds
      FROM user_connections uc
      WHERE (uc.userAId = ${userId} OR uc.userBId = ${userId})
      AND uc.connectionStrength > 0.5
      LIMIT 10
    `;

        const suggestions = [];

        for (const event of sharedEvents as any[]) {
            // Check if suggestion already exists
            const existing = await prisma.mergerSuggestion.findFirst({
                where: {
                    userId,
                    suggestedUserId: event.otherUserId,
                    status: 'ACTIVE',
                },
            });

            if (!existing) {
                const suggestion = await prisma.mergerSuggestion.create({
                    data: {
                        userId,
                        suggestedUserId: event.otherUserId,
                        sharedEventId: event.sharedEventIds[0], // Use first shared event
                        matchScore: 0.8, // Placeholder - would be calculated by AI
                        reason: 'You both shared this experience',
                        previewTitle: 'Shared Memory',
                        status: 'ACTIVE',
                    },
                });

                suggestions.push(suggestion);
            }
        }

        return suggestions;
    }

    /**
     * Dismiss suggestion
     */
    static async dismissSuggestion(suggestionId: string, userId: string) {
        const suggestion = await prisma.mergerSuggestion.findUnique({
            where: { id: suggestionId },
        });

        if (!suggestion || suggestion.userId !== userId) {
            throw new Error('Suggestion not found or unauthorized');
        }

        await prisma.mergerSuggestion.update({
            where: { id: suggestionId },
            data: {
                status: 'DISMISSED',
                dismissedAt: new Date(),
            },
        });
    }
}
