import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

const THREE_STRIKE_LIMIT = 3;

export class ScreenshotService {
    /**
     * Record a screenshot event
     */
    async recordScreenshot(subscriberId: string, creatorId: string, contentId: string) {
        try {
            const detection = await prisma.screenshotDetection.create({
                data: {
                    subscriberId,
                    creatorId,
                    contentId,
                    warningIssued: true,
                },
            });

            logger.info(`Screenshot detected: subscriber ${subscriberId}, content ${contentId}`);

            // Check if user has exceeded the three-strike limit
            const warningCount = await this.getWarningCount(subscriberId);
            if (warningCount >= THREE_STRIKE_LIMIT) {
                await this.enforceThreeStrikeRule(subscriberId);
            }

            return detection;
        } catch (error) {
            logger.error('Error recording screenshot:', error);
            throw error;
        }
    }

    /**
     * Get warning count for a subscriber
     */
    async getWarningCount(subscriberId: string): Promise<number> {
        return await prisma.screenshotDetection.count({
            where: { subscriberId },
        });
    }

    /**
     * Enforce three-strike rule (ban user or revoke access)
     */
    async enforceThreeStrikeRule(subscriberId: string) {
        try {
            // TODO: Implement actual enforcement
            // This could involve:
            // 1. Revoking all subscriptions
            // 2. Marking user as banned
            // 3. Sending notification to creator

            logger.warn(`Three-strike rule enforced for subscriber ${subscriberId}`);

            // For now, we'll just log it
            // In production, you might:
            // await prisma.user.update({
            //   where: { id: subscriberId },
            //   data: { banned: true }
            // });
        } catch (error) {
            logger.error('Error enforcing three-strike rule:', error);
            throw error;
        }
    }

    /**
     * Get screenshot history for a creator
     */
    async getCreatorScreenshotHistory(creatorId: string) {
        return await prisma.screenshotDetection.findMany({
            where: { creatorId },
            include: {
                subscriber: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                detectedAt: 'desc',
            },
        });
    }

    /**
     * Get screenshot warnings for a subscriber
     */
    async getSubscriberWarnings(subscriberId: string) {
        return await prisma.screenshotDetection.findMany({
            where: { subscriberId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                detectedAt: 'desc',
            },
        });
    }
}

export const screenshotService = new ScreenshotService();
