import prisma from '../db/prisma';

export class SearchService {
    /**
     * Full-text search for biographies (PostgreSQL)
     */
    static async searchBiographies(
        query: string,
        filters?: {
            genre?: string;
            tags?: string[];
            minViews?: number;
            verified?: boolean;
        },
        limit: number = 20,
        offset: number = 0
    ) {
        const whereClause: any = {
            published: true,
        };

        // PostgreSQL full-text search
        if (query) {
            whereClause.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { tags: { hasSome: [query.toLowerCase()] } },
            ];
        }

        // Apply filters
        if (filters?.genre) {
            whereClause.genre = filters.genre;
        }

        if (filters?.tags && filters.tags.length > 0) {
            whereClause.tags = { hasSome: filters.tags };
        }

        if (filters?.minViews) {
            whereClause.viewCount = { gte: filters.minViews };
        }

        if (filters?.verified !== undefined) {
            whereClause.user = { isVerified: filters.verified };
        }

        const biographies = await prisma.biography.findMany({
            where: whereClause,
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
            orderBy: [
                { viewCount: 'desc' },
                { createdAt: 'desc' },
            ],
            take: limit,
            skip: offset,
        });

        return biographies;
    }

    /**
     * Search creators
     */
    static async searchCreators(
        query: string,
        verified?: boolean,
        limit: number = 20,
        offset: number = 0
    ) {
        const whereClause: any = {
            role: 'CREATOR',
        };

        if (query) {
            whereClause.OR = [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { bio: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (verified !== undefined) {
            whereClause.isVerified = verified;
        }

        const creators = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                isVerified: true,
                followerCount: true,
                biographies: {
                    where: { published: true },
                    select: {
                        id: true,
                        title: true,
                        viewCount: true,
                    },
                    orderBy: { viewCount: 'desc' },
                    take: 3,
                },
            },
            orderBy: { followerCount: 'desc' },
            take: limit,
            skip: offset,
        });

        return creators;
    }

    /**
     * Get autocomplete suggestions
     */
    static async getAutocompleteSuggestions(query: string, limit: number = 10) {
        if (!query || query.length < 2) return [];

        // Get biography titles
        const biographies = await prisma.biography.findMany({
            where: {
                published: true,
                title: { contains: query, mode: 'insensitive' },
            },
            select: { title: true },
            take: 5,
        });

        // Get creator names
        const creators = await prisma.user.findMany({
            where: {
                role: 'CREATOR',
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { displayName: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: { displayName: true, firstName: true, lastName: true },
            take: 5,
        });

        // Get popular tags matching query
        const tags = await this.searchTags(query, 5);

        return {
            biographies: biographies.map(b => b.title),
            creators: creators.map(c => c.displayName || `${c.firstName} ${c.lastName}`),
            tags: tags.map(t => t.name),
        };
    }

    /**
     * Search tags/hashtags
     */
    static async searchTags(query: string, limit: number = 20) {
        // Get all biographies with tags
        const biographies = await prisma.biography.findMany({
            where: {
                published: true,
                tags: { isEmpty: false },
            },
            select: { tags: true },
        });

        // Extract and count all tags
        const tagCounts = new Map<string, number>();
        biographies.forEach(bio => {
            bio.tags?.forEach((tag: string) => {
                if (tag.toLowerCase().includes(query.toLowerCase())) {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                }
            });
        });

        // Sort by count and return
        return Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }

    /**
     * Get trending tags
     */
    static async getTrendingTags(limit: number = 20) {
        const biographies = await prisma.biography.findMany({
            where: {
                published: true,
                tags: { isEmpty: false },
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
            },
            select: { tags: true },
        });

        const tagCounts = new Map<string, number>();
        biographies.forEach(bio => {
            bio.tags?.forEach((tag: string) => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });

        return Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }

    /**
     * Save search query to history
     */
    static async saveSearchHistory(userId: string, query: string) {
        try {
            await prisma.searchHistory.create({
                data: {
                    userId,
                    query,
                },
            });
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    /**
     * Get user's search history
     */
    static async getSearchHistory(userId: string, limit: number = 10) {
        return await prisma.searchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                query: true,
                createdAt: true,
            },
        });
    }

    /**
     * Clear user's search history
     */
    static async clearSearchHistory(userId: string) {
        await prisma.searchHistory.deleteMany({
            where: { userId },
        });
    }

    /**
     * Delete specific search history item
     */
    static async deleteSearchHistoryItem(userId: string, historyId: string) {
        await prisma.searchHistory.deleteMany({
            where: {
                id: historyId,
                userId,
            },
        });
    }
}
