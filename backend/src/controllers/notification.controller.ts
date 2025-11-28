import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

/**
 * Get user notifications
 */
export async function getNotifications(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { limit = 50, offset = 0 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const notifications = await NotificationService.getUserNotifications(
            userId,
            Number(limit),
            Number(offset)
        );

        res.json({
            success: true,
            data: notifications,
        });
    } catch (error: any) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get unread count
 */
export async function getUnreadCount(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const count = await NotificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: { count },
        });
    } catch (error: any) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Mark as read
 */
export async function markAsRead(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await NotificationService.markAsRead(notificationId, userId);

        res.json({
            success: true,
            message: 'Marked as read',
        });
    } catch (error: any) {
        console.error('Error marking as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Mark all as read
 */
export async function markAllAsRead(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await NotificationService.markAllAsRead(userId);

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Register push token
 */
export async function registerPushToken(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { token } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await NotificationService.registerPushToken(userId, token);

        res.json({
            success: true,
            message: 'Push token registered',
        });
    } catch (error: any) {
        console.error('Error registering push token:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get notification preferences
 */
export async function getPreferences(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const preferences = await NotificationService.getPreferences(userId);

        res.json({
            success: true,
            data: preferences,
        });
    } catch (error: any) {
        console.error('Error getting preferences:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Update notification preferences
 */
export async function updatePreferences(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const preferences = await NotificationService.updatePreferences(userId, req.body);

        res.json({
            success: true,
            data: preferences,
        });
    } catch (error: any) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
