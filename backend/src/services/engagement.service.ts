import prisma from '../db/prisma';

export class EngagementService {
    /**
     * Add bookmark
     */
    static async addBookmark(userId: string, biographyId: string) {
        const existing = await prisma.bookmark.findUnique({
            where: {
                userId_biographyId: {
                    userId,
                    biographyId,
                },
            },
        });

        if (existing) {
            throw new Error('Biography already bookmarked');
        }

        return await prisma.bookmark.create({
            data: {
                userId,
                biographyId,
            },
            include: {
                biography: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Remove bookmark
     */
    static async removeBookmark(userId: string, biographyId: string) {
        await prisma.bookmark.deleteMany({
            where: {
                userId,
                biographyId,
            },
        });
    }

    /**
     * Get user's bookmarks
     */
    static async getUserBookmarks(userId: string, limit: number = 50, offset: number = 0) {
        return await prisma.bookmark.findMany({
            where: { userId },
            include: {
                biography: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                displayName: true,
                                avatarUrl: true,
                                isVerified: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Check if bookmarked
     */
    static async isBookmarked(userId: string, biographyId: string): Promise<boolean> {
        const bookmark = await prisma.bookmark.findUnique({
            where: {
                userId_biographyId: {
                    userId,
                    biographyId,
                },
            },
        });

        return !!bookmark;
    }

    /**
     * Update reading progress
     */
    static async updateProgress(userId: string, biographyId: string, chapterId: string, progress: number) {
        return await prisma.readingProgress.upsert({
            where: {
                userId_biographyId: {
                    userId,
                    biographyId,
                },
            },
            update: {
                currentChapterId: chapterId,
                progress,
                lastReadAt: new Date(),
            },
            create: {
                userId,
                biographyId,
                currentChapterId: chapterId,
                progress,
            },
        });
    }

    /**
     * Get reading progress
     */
    static async getProgress(userId: string, biographyId: string) {
        return await prisma.readingProgress.findUnique({
            where: {
                userId_biographyId: {
                    userId,
                    biographyId,
                },
            },
        });
    }

    /**
     * Create or update review
     */
    static async createReview(
        userId: string,
        biographyId: string,
        rating: number,
        reviewText?: string
    ) {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        const review = await prisma.review.upsert({
            where: {
                userId_biographyId: {
                    userId,
                    biographyId,
                },
            },
            update: {
                rating,
                reviewText,
            },
            create: {
                userId,
                biographyId,
                rating,
                reviewText,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                        isVerified: true,
                    },
                },
            },
        });

        // Update biography average rating
        await this.updateBiographyRating(biographyId);

        return review;
    }

    /**
     * Get biography reviews
     */
    static async getBiographyReviews(biographyId: string, limit: number = 20, offset: number = 0) {
        return await prisma.review.findMany({
            where: { biographyId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                        isVerified: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Update biography average rating
     */
    private static async updateBiographyRating(biographyId: string) {
        const reviews = await prisma.review.findMany({
            where: { biographyId },
            select: { rating: true },
        });

        if (reviews.length === 0) return;

        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await prisma.biography.update({
            where: { id: biographyId },
            data: {
                averageRating,
                reviewCount: reviews.length,
            },
        });
    }

    /**
     * Add chapter reaction
     */
    static async addReaction(userId: string, chapterId: string, reactionType: string) {
        return await prisma.chapterReaction.upsert({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId,
                },
            },
            update: {
                reactionType,
            },
            create: {
                userId,
                chapterId,
                reactionType,
            },
        });
    }

    /**
     * Remove chapter reaction
     */
    static async removeReaction(userId: string, chapterId: string) {
        await prisma.chapterReaction.deleteMany({
            where: {
                userId,
                chapterId,
            },
        });
    }

    /**
     * Get chapter reactions
     */
    static async getChapterReactions(chapterId: string) {
        const reactions = await prisma.chapterReaction.findMany({
            where: { chapterId },
        });

        // Count by type
        const counts: Record<string, number> = {};
        reactions.forEach(r => {
            counts[r.reactionType] = (counts[r.reactionType] || 0) + 1;
        });

        return counts;
    }

    /**
     * Get user's reaction for chapter
     */
    static async getUserReaction(userId: string, chapterId: string) {
        return await prisma.chapterReaction.findUnique({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId,
                },
            },
        });
    }
}
