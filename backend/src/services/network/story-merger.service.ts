import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class StoryMergerService {
    /**
     * Create merger proposal from collision
     */
    async createMergerProposal(
        collisionId: string,
        initiatorId: string
    ): Promise<any> {
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
        const approvalStatus: any = {};
        participants.forEach((userId: string) => {
            approvalStatus[userId] = userId === initiatorId ? 'approved' : 'pending';
        });

        const merger = await prisma.storyMerger.create({
            data: {
                eventId: collisionId,
                eventTitle: collision.title,
                eventDate: collision.timestamp,
                participants: JSON.stringify(participants),
                mergedContent: {}, // Empty initially
                approvalStatus: approvalStatus,
                isPublished: false,
            },
        });

        // Notify other participants
        logger.info(`Merger proposal created`, {
            mergerId: merger.id,
            participants,
            initiator: initiatorId,
        });

        return merger;
    }

    /**
     * Approve merger and add perspective
     */
    async approveMerger(
        mergerId: string,
        userId: string,
        perspective: {
            narrative: string;
            photos?: string[];
            mood?: string;
        }
    ): Promise<any> {
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
        const approvalStatus = merger.approvalStatus as any;
        approvalStatus[userId] = 'approved';

        // Add perspective to merged content
        const mergedContent = (merger.mergedContent as any) || {};
        mergedContent[userId] = perspective;

        const updated = await prisma.storyMerger.update({
            where: { id: mergerId },
            data: {
                approvalStatus: approvalStatus,
                mergedContent: mergedContent,
            },
        });

        // Check if all approved
        const allApproved = Object.values(approvalStatus).every(
            status => status === 'approved'
        );

        if (allApproved) {
            logger.info(`All participants approved merger ${mergerId}`);
        }

        return updated;
    }

    /**
     * Publish merger
     */
    async publishMerger(mergerId: string, price?: number): Promise<any> {
        const merger = await prisma.storyMerger.findUnique({
            where: { id: mergerId },
        });

        if (!merger) {
            throw new Error('Merger not found');
        }

        // Verify all participants approved
        const approvalStatus = merger.approvalStatus as any;
        const allApproved = Object.values(approvalStatus).every(
            status => status === 'approved'
        );

        if (!allApproved) {
            throw new Error('Not all participants have approved this merger');
        }

        // Default revenue share: equal split
        const participants = JSON.parse(merger.participants);
        const share = 100 / participants.length;
        const revenueShare: any = {};
        participants.forEach((userId: string) => {
            revenueShare[userId] = share;
        });

        return prisma.storyMerger.update({
            where: { id: mergerId },
            data: {
                isPublished: true,
                publishedAt: new Date(),
                price,
                revenueShare: revenueShare,
            },
        });
    }

    /**
     * Get published mergers for user
     */
    async getUserMergers(userId: string): Promise<any[]> {
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
    async getPendingMergers(userId: string): Promise<any[]> {
        const allMergers = await prisma.storyMerger.findMany({
            where: {
                isPublished: false,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Filter mergers where user is a participant and hasn't approved
        const pendingMergers = allMergers.filter(merger => {
            const participants = JSON.parse(merger.participants);
            const approvalStatus = merger.approvalStatus as any;
            return participants.includes(userId) && approvalStatus[userId] === 'pending';
        });

        return pendingMergers;
    }

    /**
     * Get merger by ID with full details
     */
    async getMergerById(mergerId: string): Promise<any> {
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
            mergedContent: merger.mergedContent || {},
            approvalStatus: merger.approvalStatus,
            revenueShare: merger.revenueShare,
        };
    }

    /**
     * Purchase access to merger
     */
    async purchaseMerger(
        mergerId: string,
        subscriberId: string
    ): Promise<any> {
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

        logger.info(`Merger purchased`, {
            mergerId,
            subscriberId,
            price: merger.price,
        });

        return { success: true, merger };
    }

    /**
     * Get marketplace mergers (public, published)
     */
    async getMarketplaceMergers(limit: number = 20): Promise<any[]> {
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

    /**
     * Detect conflicts in merger narratives
     */
    async detectConflicts(mergerId: string): Promise<any[]> {
        const merger = await this.getMergerById(mergerId);
        const conflicts: any[] = [];

        const participants = Object.keys(merger.mergedContent);
        if (participants.length < 2) return conflicts;

        // Compare narratives for discrepancies
        const narratives = participants.map(userId => ({
            userId,
            narrative: merger.mergedContent[userId].narrative,
            mood: merger.mergedContent[userId].mood,
        }));

        // Detect mood conflicts
        const moods = narratives.map(n => n.mood).filter(Boolean);
        if (moods.length > 1) {
            const uniqueMoods = [...new Set(moods)];
            if (uniqueMoods.length > 1) {
                conflicts.push({
                    id: `mood-conflict-${Date.now()}`,
                    type: 'mood',
                    description: 'Participants remember different emotional tones',
                    values: uniqueMoods,
                    participants: narratives.filter(n => n.mood).map(n => n.userId),
                });
            }
        }

        // Detect narrative length discrepancies (one very short, one very long)
        const lengths = narratives.map(n => n.narrative.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        narratives.forEach((n, i) => {
            if (n.narrative.length < avgLength * 0.3) {
                conflicts.push({
                    id: `detail-conflict-${i}`,
                    type: 'detail_mismatch',
                    description: 'One perspective lacks detail compared to others',
                    userId: n.userId,
                });
            }
        });

        return conflicts;
    }

    /**
     * Resolve conflict with chosen strategy
     */
    async resolveConflict(
        mergerId: string,
        conflictId: string,
        resolution: {
            strategy: 'voting' | 'merge' | 'split';
            selectedValue?: any;
            votes?: Record<string, any>;
        }
    ): Promise<any> {
        const merger = await this.getMergerById(mergerId);

        // Store resolution in merger metadata
        const resolutions = (merger as any).resolutions || {};
        resolutions[conflictId] = {
            ...resolution,
            resolvedAt: new Date(),
        };

        // Update merger with resolution
        await prisma.storyMerger.update({
            where: { id: mergerId },
            data: {
                // Store resolutions in revenueShare field temporarily (or add new field)
                revenueShare: {
                    ...(merger.revenueShare as any || {}),
                    _resolutions: resolutions,
                },
            },
        });

        logger.info(`Conflict resolved`, {
            mergerId,
            conflictId,
            strategy: resolution.strategy,
        });

        return { success: true, resolution };
    }
}

export const storyMergerService = new StoryMergerService();
