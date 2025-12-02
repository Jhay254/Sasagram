"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyMergerService = exports.StoryMergerService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
class StoryMergerService {
    /**
     * Create merger proposal from collision
     */
    async createMergerProposal(collisionId, initiatorId) {
        const collision = await prisma.memoryCollision.findUnique({
            where: { id: collisionId },
        });
        if (!collision) {
            throw new Error('Collision not found');
        }
        const participants = JSON.parse(collision.users);
        if (!participants.includes(initiatorId)) {
            throw new Error('You are not a participant in this collision');
        }
        // Create merger with pending approval status
        const approvalStatus = {};
        participants.forEach((userId) => {
            approvalStatus[userId] = userId === initiatorId ? 'approved' : 'pending';
        });
        const merger = await prisma.storyMerger.create({
            data: {
                eventId: collisionId,
                eventTitle: collision.title,
                eventDate: collision.timestamp,
                participants: JSON.stringify(participants),
                mergedContent: JSON.stringify({}), // Empty initially
                approvalStatus: JSON.stringify(approvalStatus),
                isPublished: false,
            },
        });
        // Notify other participants
        logger_1.default.info(`Merger proposal created`, {
            mergerId: merger.id,
            participants,
            initiator: initiatorId,
        });
        return merger;
    }
    /**
     * Approve merger and add perspective
     */
    async approveMerger(mergerId, userId, perspective) {
        const merger = await prisma.storyMerger.findUnique({
            where: { id: mergerId },
        });
        if (!merger) {
            throw new Error('Merger not found');
        }
        const participants = JSON.parse(merger.participants);
        if (!participants.includes(userId)) {
            throw new Error('Unauthorized');
        }
        // Update approval status
        const approvalStatus = JSON.parse(merger.approvalStatus);
        approvalStatus[userId] = 'approved';
        // Add perspective to merged content
        const mergedContent = JSON.parse(merger.mergedContent || '{}');
        mergedContent[userId] = perspective;
        const updated = await prisma.storyMerger.update({
            where: { id: mergerId },
            data: {
                approvalStatus: JSON.stringify(approvalStatus),
                mergedContent: JSON.stringify(mergedContent),
            },
        });
        // Check if all approved
        const allApproved = Object.values(approvalStatus).every(status => status === 'approved');
        if (allApproved) {
            logger_1.default.info(`All participants approved merger ${mergerId}`);
        }
        return updated;
    }
    /**
     * Publish merger
     */
    async publishMerger(mergerId, price) {
        const merger = await prisma.storyMerger.findUnique({
            where: { id: mergerId },
        });
        if (!merger) {
            throw new Error('Merger not found');
        }
        // Verify all participants approved
        const approvalStatus = JSON.parse(merger.approvalStatus);
        const allApproved = Object.values(approvalStatus).every(status => status === 'approved');
        if (!allApproved) {
            throw new Error('Not all participants have approved this merger');
        }
        // Default revenue share: equal split
        const participants = JSON.parse(merger.participants);
        const share = 100 / participants.length;
        const revenueShare = {};
        participants.forEach((userId) => {
            revenueShare[userId] = share;
        });
        return prisma.storyMerger.update({
            where: { id: mergerId },
            data: {
                isPublished: true,
                publishedAt: new Date(),
                price,
                revenueShare: JSON.stringify(revenueShare),
            },
        });
    }
    /**
     * Get published mergers for user
     */
    async getUserMergers(userId) {
        const allMergers = await prisma.storyMerger.findMany({
            where: {
                isPublished: true,
            },
            orderBy: { publishedAt: 'desc' },
        });
        // Filter mergers where user is a participant
        const userMergers = allMergers.filter(merger => {
            const participants = JSON.parse(merger.participants);
            return participants.includes(userId);
        });
        return userMergers;
    }
    /**
     * Get pending merger proposals for user
     */
    async getPendingMergers(userId) {
        const allMergers = await prisma.storyMerger.findMany({
            where: {
                isPublished: false,
            },
            orderBy: { createdAt: 'desc' },
        });
        // Filter mergers where user is a participant and hasn't approved
        const pendingMergers = allMergers.filter(merger => {
            const participants = JSON.parse(merger.participants);
            const approvalStatus = JSON.parse(merger.approvalStatus);
            return participants.includes(userId) && approvalStatus[userId] === 'pending';
        });
        return pendingMergers;
    }
    /**
     * Get merger by ID with full details
     */
    async getMergerById(mergerId) {
        const merger = await prisma.storyMerger.findUnique({
            where: { id: mergerId },
        });
        if (!merger) {
            throw new Error('Merger not found');
        }
        // Parse JSON fields
        return {
            ...merger,
            participants: JSON.parse(merger.participants),
            mergedContent: JSON.parse(merger.mergedContent || '{}'),
            approvalStatus: JSON.parse(merger.approvalStatus),
            revenueShare: merger.revenueShare ? JSON.parse(merger.revenueShare) : null,
        };
    }
    /**
     * Purchase access to merger
     */
    async purchaseMerger(mergerId, subscriberId) {
        const merger = await prisma.storyMerger.findUnique({
            where: { id: mergerId },
        });
        if (!merger || !merger.isPublished) {
            throw new Error('Merger not available');
        }
        // TODO: Process payment via payment service
        // TODO: Grant access to subscriber
        // TODO: Split revenue among participants
        await prisma.storyMerger.update({
            where: { id: mergerId },
            data: { salesCount: { increment: 1 } },
        });
        logger_1.default.info(`Merger purchased`, {
            mergerId,
            subscriberId,
            price: merger.price,
        });
        return { success: true, merger };
    }
    /**
     * Get marketplace mergers (public, published)
     */
    async getMarketplaceMergers(limit = 20) {
        const mergers = await prisma.storyMerger.findMany({
            where: {
                isPublished: true,
            },
            orderBy: { publishedAt: 'desc' },
            take: limit,
        });
        return mergers.map(merger => ({
            ...merger,
            participants: JSON.parse(merger.participants),
            // Don't expose full content in marketplace listing
            mergedContent: undefined,
            approvalStatus: undefined,
        }));
    }
}
exports.StoryMergerService = StoryMergerService;
exports.storyMergerService = new StoryMergerService();
