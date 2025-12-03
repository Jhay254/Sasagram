"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taggingService = exports.TaggingService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const notification_service_1 = require("../notification.service");
const invite_service_1 = require("../invite.service");
const prisma = new client_1.PrismaClient();
class TaggingService {
    /**
     * Tag a user in an event
     */
    async tagUser(taggerId, taggedUserEmail, eventData) {
        // Find tagged user
        let taggedUser = await prisma.user.findUnique({
            where: { email: taggedUserEmail },
        });
        // If user doesn't exist, create invitation record
        if (!taggedUser) {
            logger_1.default.info(`User ${taggedUserEmail} not found - invitation needed`);
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
    async verifyTag(tagId, taggedUserId, verificationData) {
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
        const { connectionService } = await Promise.resolve().then(() => __importStar(require('./connection.service')));
        await connectionService.createOrUpdateConnection(tag.taggerId, taggedUserId);
        return updatedTag;
    }
    /**
     * Decline a tag
     */
    async declineTag(tagId, taggedUserId) {
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
    async getPendingTags(userId) {
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
    async getUserTags(userId) {
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
    async updateMemoryCompleteness(userId) {
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
    async sendTagInvitation(taggerId, email, eventData) {
        // Generate invite token
        const inviteToken = invite_service_1.inviteService.generateInviteToken('pending', email);
        // Send invitation email
        await notification_service_1.notificationService.sendInviteNotification(taggerId, email, eventData, inviteToken);
        logger_1.default.info(`Tag invitation sent to ${email}`, {
            taggerId,
            event: eventData.eventTitle,
        });
    }
    /**
     * Send tag notification
     */
    async sendTagNotification(tagId) {
        await notification_service_1.notificationService.sendTagNotification(tagId);
    }
}
exports.TaggingService = TaggingService;
exports.taggingService = new TaggingService();
