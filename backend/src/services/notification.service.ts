import prisma from '../db/prisma';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export enum NotificationType {
    TAG_RECEIVED = 'TAG_RECEIVED',
    TAG_VERIFIED = 'TAG_VERIFIED',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    NEW_REVIEW = 'NEW_REVIEW',
    CHAPTER_REACTION = 'CHAPTER_REACTION',
    MEMORY_COLLISION = 'MEMORY_COLLISION',
    MILESTONE_ACHIEVED = 'MILESTONE_ACHIEVED',
    REFERRAL_SIGNUP = 'REFERRAL_SIGNUP',
}

export class NotificationService {
    /**
     * Create in-app notification
     */
    static async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        data?: any
    ) {
        return await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data,
            },
        });
    }

    /**
     * Get user notifications
     */
    static async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
        return await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Get unread count
     */
    static async getUnreadCount(userId: string): Promise<number> {
        return await prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });
    }

    /**
     * Mark as read
     */
    static async markAsRead(notificationId: string, userId: string) {
        await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: { read: true },
        });
    }

    /**
     * Mark all as read
     */
    static async markAllAsRead(userId: string) {
        await prisma.notification.updateMany({
            where: {
                userId,
                read: false,
            },
            data: { read: true },
        });
    }

    /**
     * Send push notification
     */
    static async sendPushNotification(
        userId: string,
        title: string,
        body: string,
        data?: any
    ) {
        try {
            // Get user's push tokens
            const tokens = await prisma.pushToken.findMany({
                where: {
                    userId,
                    active: true,
                },
            });

            if (tokens.length === 0) return;

            const messages: ExpoPushMessage[] = tokens.map(token => ({
                to: token.token,
                sound: 'default',
                title,
                body,
                data,
            }));

            const chunks = expo.chunkPushNotifications(messages);
            const tickets = [];

            for (const chunk of chunks) {
                try {
                    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    tickets.push(...ticketChunk);
                } catch (error) {
                    console.error('Error sending push notification chunk:', error);
                }
            }

            return tickets;
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }

    /**
     * Register push token
     */
    static async registerPushToken(userId: string, token: string) {
        return await prisma.pushToken.upsert({
            where: {
                userId_token: {
                    userId,
                    token,
                },
            },
            update: {
                active: true,
            },
            create: {
                userId,
                token,
                active: true,
            },
        });
    }

    /**
     * Unregister push token
     */
    static async unregisterPushToken(userId: string, token: string) {
        await prisma.pushToken.updateMany({
            where: {
                userId,
                token,
            },
            data: { active: false },
        });
    }

    /**
     * Get notification preferences
     */
    static async getPreferences(userId: string) {
        let prefs = await prisma.notificationPreferences.findUnique({
            where: { userId },
        });

        if (!prefs) {
            // Create default preferences
            prefs = await prisma.notificationPreferences.create({
                data: {
                    userId,
                    emailNotifications: true,
                    pushNotifications: true,
                    tagNotifications: true,
                    followNotifications: true,
                    reviewNotifications: true,
                    collisionNotifications: true,
                    milestoneNotifications: true,
                },
            });
        }

        return prefs;
    }

    /**
     * Update notification preferences
     */
    static async updatePreferences(userId: string, preferences: any) {
        return await prisma.notificationPreferences.upsert({
            where: { userId },
            update: preferences,
            create: {
                userId,
                ...preferences,
            },
        });
    }

    /**
     * Check if user wants this notification type
     */
    static async shouldNotify(userId: string, type: NotificationType): Promise<boolean> {
        const prefs = await this.getPreferences(userId);

        const typeMap: Record<NotificationType, keyof typeof prefs> = {
            TAG_RECEIVED: 'tagNotifications',
            TAG_VERIFIED: 'tagNotifications',
            NEW_FOLLOWER: 'followNotifications',
            NEW_REVIEW: 'reviewNotifications',
            CHAPTER_REACTION: 'reviewNotifications',
            MEMORY_COLLISION: 'collisionNotifications',
            MILESTONE_ACHIEVED: 'milestoneNotifications',
            REFERRAL_SIGNUP: 'milestoneNotifications',
        };

        const prefKey = typeMap[type];
        return prefs[prefKey] as boolean;
    }

    /**
     * Send notification (in-app + push + email if enabled)
     */
    static async sendNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        data?: any
    ) {
        // Check preferences
        const shouldSend = await this.shouldNotify(userId, type);
        if (!shouldSend) return;

        const prefs = await this.getPreferences(userId);

        // Create in-app notification
        await this.createNotification(userId, type, title, message, data);

        // Send push notification if enabled
        if (prefs.pushNotifications) {
            await this.sendPushNotification(userId, title, message, data);
        }

        // Send email if enabled (placeholder)
        if (prefs.emailNotifications) {
            // TODO: Implement email sending
            console.log('Send email notification:', { userId, title, message });
        }
    }
}
