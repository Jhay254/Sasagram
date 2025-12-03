"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenshotService = exports.ScreenshotService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
const THREE_STRIKE_LIMIT = 3;
class ScreenshotService {
    /**
     * Record a screenshot event
     */
    async recordScreenshot(subscriberId, creatorId, contentId) {
        try {
            const detection = await prisma.screenshotDetection.create({
                data: {
                    subscriberId,
                    creatorId,
                    contentId,
                    warningIssued: true,
                },
            });
            logger_1.default.info(`Screenshot detected: subscriber ${subscriberId}, content ${contentId}`);
            // Check if user has exceeded the three-strike limit
            const warningCount = await this.getWarningCount(subscriberId);
            if (warningCount >= THREE_STRIKE_LIMIT) {
                await this.enforceThreeStrikeRule(subscriberId);
            }
            return detection;
        }
        catch (error) {
            logger_1.default.error('Error recording screenshot:', error);
            throw error;
        }
    }
    /**
     * Get warning count for a subscriber
     */
    async getWarningCount(subscriberId) {
        return await prisma.screenshotDetection.count({
            where: { subscriberId },
        });
    }
    /**
     * Enforce three-strike rule (ban user or revoke access)
     */
    async enforceThreeStrikeRule(subscriberId) {
        try {
            // TODO: Implement actual enforcement
            // This could involve:
            // 1. Revoking all subscriptions
            // 2. Marking user as banned
            // 3. Sending notification to creator
            logger_1.default.warn(`Three-strike rule enforced for subscriber ${subscriberId}`);
            // For now, we'll just log it
            // In production, you might:
            // await prisma.user.update({
            //   where: { id: subscriberId },
            //   data: { banned: true }
            // });
        }
        catch (error) {
            logger_1.default.error('Error enforcing three-strike rule:', error);
            throw error;
        }
    }
    /**
     * Get screenshot history for a creator
     */
    async getCreatorScreenshotHistory(creatorId) {
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
    async getSubscriberWarnings(subscriberId) {
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
exports.ScreenshotService = ScreenshotService;
exports.screenshotService = new ScreenshotService();
