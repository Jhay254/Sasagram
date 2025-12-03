import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class NotificationService {
    /**
     * Schedule "On This Day" notification for a user
     */
    async scheduleOnThisDayNotification(userId: string): Promise<void> {
        try {
            // Check if user has memories from this day in previous years
            const today = new Date();
            const month = today.getMonth() + 1;
            const day = today.getDate();

            const allContent = await prisma.content.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
            });

            const onThisDayContent = allContent.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate.getMonth() + 1 === month &&
                    itemDate.getDate() === day &&
                    itemDate.getFullYear() !== today.getFullYear();
            });

            if (onThisDayContent.length > 0) {
                // Create notification record
                await prisma.notification.create({
                    data: {
                        userId,
                        type: 'on_this_day',
                        title: 'On This Day',
                        message: `You have ${onThisDayContent.length} ${onThisDayContent.length === 1 ? 'memory' : 'memories'} from this day in previous years`,
                        data: JSON.stringify({
                            count: onThisDayContent.length,
                            years: [...new Set(onThisDayContent.map(c => new Date(c.timestamp).getFullYear()))],
                        }),
                        scheduled: true,
                    },
                });

                logger.info(`Scheduled On This Day notification for user ${userId}`);
            }
        } catch (error) {
            logger.error('Error scheduling On This Day notification:', error);
            throw error;
        }
    }

    /**
     * Send random memory notification
     */
    async sendRandomMemoryNotification(userId: string): Promise<void> {
        try {
            const count = await prisma.content.count({ where: { userId } });
            if (count === 0) return;

            const skip = Math.floor(Math.random() * count);
            const randomContent = await prisma.content.findFirst({
                where: { userId },
                skip,
            });

            if (randomContent) {
                await prisma.notification.create({
                    data: {
                        userId,
                        type: 'random_memory',
                        title: 'Random Memory',
                        message: randomContent.text?.substring(0, 100) || 'A memory from your past',
                        data: JSON.stringify({
                            contentId: randomContent.id,
                            date: randomContent.timestamp,
                        }),
                    },
                });

                logger.info(`Sent random memory notification to user ${userId}`);
            }
        } catch (error) {
            logger.error('Error sending random memory notification:', error);
            throw error;
        }
    }

    /**
     * Track notification engagement
     */
    async trackNotificationEngagement(userId: string, notificationId: string, action: 'clicked' | 'dismissed'): Promise<void> {
        try {
            await prisma.notification.update({
                where: { id: notificationId },
                data: {
                    read: action === 'clicked',
                    clickedAt: action === 'clicked' ? new Date() : undefined,
                },
            });

            logger.info(`Tracked notification ${action} for user ${userId}`);
        } catch (error) {
            logger.error('Error tracking notification engagement:', error);
            throw error;
        }
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
        try {
            return await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
        } catch (error) {
            logger.error('Error fetching user notifications:', error);
            throw error;
        }
    }
}

export const notificationService = new NotificationService();
