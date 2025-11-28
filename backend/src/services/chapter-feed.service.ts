import prisma from '../db/prisma';
import { UpdateType } from '@prisma/client';

export class ChapterFeedService {
    /**
     * Create a micro-update for a chapter
     */
    static async createMicroUpdate(
        chapterId: string,
        summary: string,
        content?: string,
        updateType: UpdateType = 'MICRO_UPDATE'
    ) {
        const update = await prisma.chapterUpdate.create({
            data: {
                chapterId,
                summary,
                content,
                updateType,
                isPublic: true,
            },
            include: {
                chapter: {
                    include: {
                        biography: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });

        // Notify followers about the update
        await this.notifyUpdateToFollowers(update);

        return update;
    }

    /**
     * Get all updates for a specific chapter
     */
    static async getChapterUpdates(chapterId: string, limit: number = 50, offset: number = 0) {
        return await prisma.chapterUpdate.findMany({
            where: {
                chapterId,
                isPublic: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                chapter: {
                    select: {
                        id: true,
                        title: true,
                        biographyId: true,
                    },
                },
            },
        });
    }

    /**
     * Get living feed for a specific biography
     */
    static async getBiographyFeed(biographyId: string, limit: number = 50, offset: number = 0) {
        return await prisma.chapterUpdate.findMany({
            where: {
                chapter: {
                    biographyId,
                },
                isPublic: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                chapter: {
                    select: {
                        id: true,
                        title: true,
                        order: true,
                        biographyId: true,
                        biography: {
                            select: {
                                id: true,
                                title: true,
                                user: {
                                    select: {
                                        displayName: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Get aggregated feed from all followed biographies
     */
    static async getFollowingFeed(userId: string, limit: number = 50, offset: number = 0) {
        // Get list of users the current user follows
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });

        const followingIds = following.map((f) => f.followingId);

        if (followingIds.length === 0) {
            return [];
        }

        // Get updates from followed creators
        return await prisma.chapterUpdate.findMany({
            where: {
                chapter: {
                    biography: {
                        userId: {
                            in: followingIds,
                        },
                    },
                },
                isPublic: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                chapter: {
                    select: {
                        id: true,
                        title: true,
                        order: true,
                        biographyId: true,
                        biography: {
                            select: {
                                id: true,
                                title: true,
                                user: {
                                    select: {
                                        id: true,
                                        displayName: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Detect content changes and create automatic update
     * This is called when a chapter is edited
     */
    static async detectContentChanges(
        chapterId: string,
        newContent: string,
        oldContent: string
    ): Promise<void> {
        // Calculate basic diff metrics
        const oldWordCount = oldContent.split(/\s+/).length;
        const newWordCount = newContent.split(/\s+/).length;
        const wordDiff = newWordCount - oldWordCount;

        if (Math.abs(wordDiff) < 10) {
            // Minor edit, don't create update
            return;
        }

        let summary = '';
        let updateType: UpdateType = 'EDIT';

        if (wordDiff > 100) {
            summary = `Added ${wordDiff} words of new content`;
            updateType = 'ADDITION';
        } else if (wordDiff < -100) {
            summary = `Removed ${Math.abs(wordDiff)} words`;
            updateType = 'EDIT';
        } else if (wordDiff > 0) {
            summary = `Minor additions (+${wordDiff} words)`;
            updateType = 'EDIT';
        } else {
            summary = `Content revised (${Math.abs(wordDiff)} words)`;
            updateType = 'EDIT';
        }

        // Create update record
        await this.createMicroUpdate(chapterId, summary, undefined, updateType);
    }

    /**
     * Create a correction/errata update
     */
    static async createCorrection(
        chapterId: string,
        correctionDescription: string
    ) {
        return await this.createMicroUpdate(
            chapterId,
            correctionDescription,
            undefined,
            'CORRECTION'
        );
    }

    /**
     * Notify followers about chapter update
     */
    private static async notifyUpdateToFollowers(update: any): Promise<void> {
        const { NotificationService } = await import('./notification.service');

        const creatorId = update.chapter.biography.userId;

        // Get all followers
        const followers = await prisma.follow.findMany({
            where: { followingId: creatorId },
            select: { followerId: true },
        });

        const creatorName =
            update.chapter.biography.user.displayName || update.chapter.biography.user.email;

        // Send notification to each follower
        for (const follower of followers) {
            await NotificationService.sendNotification(
                follower.followerId,
                'CHAPTER_UPDATE' as any,
                `Update from ${creatorName}`,
                `${update.summary} in "${update.chapter.title}"`,
                {
                    chapterId: update.chapter.id,
                    biographyId: update.chapter.biographyId,
                    updateId: update.id,
                }
            );
        }
    }

    /**
     * Delete an update (creator only)
     */
    static async deleteUpdate(updateId: string, userId: string): Promise<void> {
        const update = await prisma.chapterUpdate.findUnique({
            where: { id: updateId },
            include: {
                chapter: {
                    include: {
                        biography: true,
                    },
                },
            },
        });

        if (!update) {
            throw new Error('Update not found');
        }

        // Verify ownership
        if (update.chapter.biography.userId !== userId) {
            throw new Error('Unauthorized: You can only delete your own updates');
        }

        await prisma.chapterUpdate.delete({
            where: { id: updateId },
        });
    }

    /**
     * Get update count for a chapter
     */
    static async getUpdateCount(chapterId: string): Promise<number> {
        return await prisma.chapterUpdate.count({
            where: {
                chapterId,
                isPublic: true,
            },
        });
    }
}
