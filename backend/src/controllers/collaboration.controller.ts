import { Request, Response } from 'express';
import { CollaborationService } from '../services/collaboration.service';

/**
 * Send collaboration invitation
 * POST /api/collaboration/invite
 */
export const sendInvitation = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user?.userId;
        const { recipientId, sharedEventId, message, proposedSplit } = req.body;

        if (!senderId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!recipientId || !sharedEventId) {
            return res.status(400).json({ error: 'recipientId and sharedEventId are required' });
        }

        const invite = await CollaborationService.sendInvitation(
            senderId,
            recipientId,
            sharedEventId,
            message,
            proposedSplit
        );

        res.status(201).json(invite);
    } catch (error: any) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ error: error.message || 'Failed to send invitation' });
    }
};

/**
 * Get user's invitations
 * GET /api/collaboration/invites?filter=sent|received
 */
export const getInvitations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const filter = req.query.filter as 'sent' | 'received' | undefined;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const invites = await CollaborationService.getUserInvitations(userId, filter);

        res.json({ count: invites.length, invites });
    } catch (error: any) {
        console.error('Error getting invitations:', error);
        res.status(500).json({ error: error.message || 'Failed to get invitations' });
    }
};

/**
 * Accept invitation
 * POST /api/collaboration/:id/accept
 */
export const acceptInvitation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;
        const { responseMessage } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const invite = await CollaborationService.acceptInvitation(id, userId, responseMessage);

        res.json({
            success: true,
            message: 'Invitation accepted',
            invite,
        });
    } catch (error: any) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ error: error.message || 'Failed to accept invitation' });
    }
};

/**
 * Decline invitation
 * POST /api/collaboration/:id/decline
 */
export const declineInvitation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;
        const { responseMessage } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const invite = await CollaborationService.declineInvitation(id, userId, responseMessage);

        res.json({
            success: true,
            message: 'Invitation declined',
            invite,
        });
    } catch (error: any) {
        console.error('Error declining invitation:', error);
        res.status(500).json({ error: error.message || 'Failed to decline invitation' });
    }
};

/**
 * Cancel sent invitation
 * POST /api/collaboration/:id/cancel
 */
export const cancelInvitation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await CollaborationService.cancelInvitation(id, userId);

        res.json({ success: true, message: 'Invitation cancelled' });
    } catch (error: any) {
        console.error('Error cancelling invitation:', error);
        res.status(500).json({ error: error.message || 'Failed to cancel invitation' });
    }
};

/**
 * Get merger suggestions
 * GET /api/collaboration/suggestions
 */
export const getSuggestions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const suggestions = await CollaborationService.generateSuggestions(userId);

        res.json({ count: suggestions.length, suggestions });
    } catch (error: any) {
        console.error('Error getting suggestions:', error);
        res.status(500).json({ error: error.message || 'Failed to get suggestions' });
    }
};

/**
 * Dismiss suggestion
 * POST /api/collaboration/suggestions/:id/dismiss
 */
export const dismissSuggestion = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await CollaborationService.dismissSuggestion(id, userId);

        res.json({ success: true, message: 'Suggestion dismissed' });
    } catch (error: any) {
        console.error('Error dismissing suggestion:', error);
        res.status(500).json({ error: error.message || 'Failed to dismiss suggestion' });
    }
};
