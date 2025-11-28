import prisma from '../db/prisma';
import { AIService } from './ai.service';

/**
 * Story Merger Service - Collaborative dual-perspective chapters
 * Features: Adjustable revenue splits, edit locking, mutual deletion consent
 */
export class StoryMergerService {
    /**
     * Create merged chapter from two chapters
     */
    static async createMergedChapter(
        creatorAId: string,
        creatorBId: string,
        chapterAId: string,
        chapterBId: string,
        invitationId: string,
        revenueSplit: number = 0.5
    ) {
        // Get both chapters
        const [chapterA, chapterB] = await Promise.all([
            prisma.chapter.findUnique({ where: { id: chapterAId } }),
            prisma.chapter.findUnique({ where: { id: chapterBId } }),
        ]);

        if (!chapterA || !chapterB) {
            throw new Error('One or both chapters not found');
        }

        // Generate merged content using AI
        const mergedData = await this.generateMergedContent(chapterA, chapterB);

        // Create merged chapter
        const mergedChapter = await prisma.mergedChapter.create({
            data: {
                creatorAId,
                creatorBId,
                chapterAId,
                chapterBId,
                invitationId,
                title: mergedData.title,
                perspectiveAContent: chapterA.content,
                perspectiveBContent: chapterB.content,
                mergedContent: mergedData.synchronized,
                revenueSplitRatio: revenueSplit,
                status: 'DRAFT',
            },
        });

        // Create initial version
        await this.createVersion(mergedChapter.id, creatorAId, 'Initial creation');

        return mergedChapter;
    }

    /**
     * Generate AI-merged content with synchronized perspectives
     */
    private static async generateMergedContent(chapterA: any, chapterB: any) {
        const prompt = `Merge these two perspectives of the same event into a synchronized dual-column format.

Perspective A (${chapterA.title}):
${chapterA.content}

Perspective B (${chapterB.title}):
${chapterB.content}

Create:
1. A merged title that reflects both perspectives
2. Synchronized content that aligns matching sections
3. Highlight where perspectives diverge

Format as JSON with: { title, synchronized: [...] }`;

        try {
            const response = await AIService.generateText(prompt);
            const parsed = JSON.parse(response);

            return {
                title: parsed.title || `${chapterA.title} (Merged)`,
                synchronized: parsed.synchronized || [],
            };
        } catch (error) {
            // Fallback if AI fails
            return {
                title: `${chapterA.title} & ${chapterB.title}`,
                synchronized: [
                    { section: 'Perspective A', content: chapterA.content },
                    { section: 'Perspective B', content: chapterB.content },
                ],
            };
        }
    }

    /**
     * Lock chapter for editing (prevent simultaneous edits)
     */
    static async lockForEditing(mergedChapterId: string, userId: string) {
        const chapter = await prisma.mergedChapter.findUnique({
            where: { id: mergedChapterId },
        });

        if (!chapter) {
            throw new Error('Merged chapter not found');
        }

        // Check if already locked
        if (chapter.lockedBy && chapter.lockExpires && chapter.lockExpires > new Date()) {
            if (chapter.lockedBy !== userId) {
                throw new Error(`Chapter is currently being edited by another user`);
            }
        }

        // Lock for 30 minutes
        const lockExpires = new Date(Date.now() + 30 * 60 * 1000);

        await prisma.mergedChapter.update({
            where: { id: mergedChapterId },
            data: {
                lockedBy: userId,
                lockedAt: new Date(),
                lockExpires,
            },
        });

        return { locked: true, expiresAt: lockExpires };
    }

    /**
     * Unlock chapter after editing
     */
    static async unlockChapter(mergedChapterId: string, userId: string) {
        const chapter = await prisma.mergedChapter.findUnique({
            where: { id: mergedChapterId },
        });

        if (chapter?.lockedBy !== userId) {
            throw new Error('You do not have the lock on this chapter');
        }

        await prisma.mergedChapter.update({
            where: { id: mergedChapterId },
            data: {
                lockedBy: null,
                lockedAt: null,
                lockExpires: null,
            },
        });
    }

    /**
     * Update merged chapter content
     */
    static async updateContent(
        mergedChapterId: string,
        userId: string,
        updates: {
            perspectiveAContent?: string;
            perspectiveBContent?: string;
            mergedContent?: any;
        }
    ) {
        const chapter = await prisma.mergedChapter.findUnique({
            where: { id: mergedChapterId },
        });

        if (!chapter) {
            throw new Error('Merged chapter not found');
        }

        // Verify user is a collaborator
        if (chapter.creatorAId !== userId && chapter.creatorBId !== userId) {
            throw new Error('Unauthorized');
        }

        // Verify lock
        if (chapter.lockedBy !== userId) {
            throw new Error('You must lock the chapter before editing');
        }

        // Update chapter
        const updated = await prisma.mergedChapter.update({
            where: { id: mergedChapterId },
            data: updates,
        });

        // Create version
        await this.createVersion(mergedChapterId, userId, 'Content updated');

        return updated;
    }

    /**
     * Request deletion (requires mutual consent)
     */
    static async requestDeletion(mergedChapterId: string, userId: string) {
        const chapter = await prisma.mergedChapter.findUnique({
            where: { id: mergedChapterId },
        });

        if (!chapter) {
            throw new Error('Merged chapter not found');
        }

        const isCreatorA = chapter.creatorAId === userId;
        const isCreatorB = chapter.creatorBId === userId;

        if (!isCreatorA && !isCreatorB) {
            throw new Error('Unauthorized');
        }

        // Mark deletion request
        await prisma.mergedChapter.update({
            where: { id: mergedChapterId },
            data: {
                [isCreatorA ? 'creatorAWantsDelete' : 'creatorBWantsDelete']: true,
                deletionRequestedAt: new Date(),
            },
        });

        // Check if both agreed
        const updated = await prisma.mergedChapter.findUnique({
            where: { id: mergedChapterId },
        });

        if (updated!.creatorAWantsDelete && updated!.creatorBWantsDelete) {
            // Both agreed - delete
            await prisma.mergedChapter.delete({
                where: { id: mergedChapterId },
            });

            return { deleted: true, message: 'Merged chapter deleted (mutual consent)' };
        }

        // Notify other creator
        const otherCreatorId = isCreatorA ? chapter.creatorBId : chapter.creatorAId;
        // TODO: Send notification

        return { deleted: false, message: 'Deletion request sent to collaborator' };
    }

    /**
     * Transfer ownership if one creator deletes account
     */
    static async transferOnAccountDeletion(deletedUserId: string) {
        // Find all merged chapters where user is a collaborator
        const mergedChapters = await prisma.mergedChapter.findMany({
            where: {
                OR: [
                    { creatorAId: deletedUserId },
                    { creatorBId: deletedUserId },
                ],
            },
        });

        for (const chapter of mergedChapters) {
            const remainingCreatorId =
                chapter.creatorAId === deletedUserId ? chapter.creatorBId : chapter.creatorAId;

            // Transfer to remaining creator (convert to solo chapter)
            await prisma.mergedChapter.update({
                where: { id: chapter.id },
                data: {
                    status: 'ARCHIVED',
                    // Keep both perspectives but mark as transferred
                },
            });

            // TODO: Notify remaining creator
            // TODO: Convert to solo chapter in their biography
        }

        return mergedChapters.length;
    }

    /**
     * Calculate and distribute revenue (adjustable split)
     */
    static async distributeRevenue(mergedChapterId: string, earnings: number) {
        const chapter = await prisma.mergedChapter.findUnique({
            where: { id: mergedChapterId },
        });

        if (!chapter) {
            throw new Error('Merged chapter not found');
        }

        const splitRatio = chapter.revenueSplitRatio; // e.g., 0.5 for 50/50, 0.6 for 60/40

        const creatorAShare = earnings * splitRatio;
        const creatorBShare = earnings * (1 - splitRatio);

        await prisma.mergedChapter.update({
            where: { id: mergedChapterId },
            data: {
                totalEarnings: { increment: earnings },
                creatorAEarnings: { increment: creatorAShare },
                creatorBEarnings: { increment: creatorBShare },
            },
        });

        return {
            total: earnings,
            creatorA: creatorAShare,
            creatorB: creatorBShare,
            ratio: `${splitRatio * 100}/${(1 - splitRatio) * 100}`,
        };
    }

    /**
     * Get user's merged chapters
     */
    static async getUserMergedChapters(userId: string) {
        return await prisma.mergedChapter.findMany({
            where: {
                OR: [
                    { creatorAId: userId },
                    { creatorBId: userId },
                ],
            },
            include: {
                creatorA: { select: { id: true, name: true, profilePictureUrl: true } },
                creatorB: { select: { id: true, name: true, profilePictureUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Create version snapshot
     */
    private static async createVersion(
        mergedChapterId: string,
        editedBy: string,
        description: string
    ) {
        const chapter = await prisma.mergedChapter.findUnique({
            where: { id: mergedChapterId },
        });

        if (!chapter) return;

        const versionCount = await prisma.mergerVersion.count({
            where: { mergedChapterId },
        });

        await prisma.mergerVersion.create({
            data: {
                mergedChapterId,
                versionNumber: versionCount + 1,
                editedBy,
                contentSnapshot: chapter.mergedContent,
                perspectiveASnapshot: chapter.perspectiveAContent,
                perspectiveBSnapshot: chapter.perspectiveBContent,
                changeDescription: description,
            },
        });
    }

    /**
     * Auto-unlock expired locks (run as cron job)
     */
    static async unlockExpiredChapters() {
        const result = await prisma.mergedChapter.updateMany({
            where: {
                lockExpires: { lte: new Date() },
                lockedBy: { not: null },
            },
            data: {
                lockedBy: null,
                lockedAt: null,
                lockExpires: null,
            },
        });

        console.log(`Auto-unlocked ${result.count} expired chapter locks`);
        return result.count;
    }
}
