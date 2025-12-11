import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface DiscoveryParams {
    tab: 'for-you' | 'trending' | 'new' | 'category';
    category?: string;
    interests?: string[];
    lifeStage?: string;
    page?: number;
    limit?: number;
    userId?: string; // For personalization
}

export interface DiscoveryResponse {
    creators: any[];
    hasMore: boolean;
    total: number;
}

/**
 * Discovery Service
 * Handles creator discovery, search, and personalization
 */
export class DiscoveryService {
    /**
     * Get creators for discovery feed
     */
    async getDiscoveryCreators(params: DiscoveryParams): Promise<DiscoveryResponse> {
        const { tab, category, interests, page = 1, limit = 10, userId } = params;

        // Build base query for creators
        const where: any = {
            role: UserRole.CREATOR,
        };

        // Filter by category if specified
        if (category) {
            where.categories = {
                has: category,
            };
        }

        // Get total count
        const total = await prisma.user.count({ where });

        // Build orderBy based on tab
        let orderBy: any = {};
        if (tab === 'trending') {
            orderBy = { trendingScore: 'desc' };
        } else if (tab === 'new') {
            orderBy = { createdAt: 'desc' };
        } else if (tab === 'for-you') {
            // For personalized feed, we'll sort by relevance score (calculated below)
            orderBy = { subscriberCount: 'desc' }; // Default fallback
        } else {
            orderBy = { createdAt: 'desc' };
        }

        // Fetch creators with pagination
        const creators = await prisma.user.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                livingChapters: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                createdTiers: {
                    where: { isActive: true },
                    orderBy: { price: 'asc' },
                },
            },
        });

        // Calculate relevance scores for "For You" tab
        let processedCreators = creators;
        if (tab === 'for-you' && interests && interests.length > 0) {
            processedCreators = this.calculateRelevanceScores(creators, interests);
        }

        // Map to frontend format
        const mappedCreators = processedCreators.map((creator) => this.mapCreatorToFrontend(creator));

        return {
            creators: mappedCreators,
            hasMore: (page * limit) < total,
            total,
        };
    }

    /**
     * Search creators by query
     */
    async searchCreators(query: string, page = 1, limit = 10): Promise<DiscoveryResponse> {
        const where = {
            role: UserRole.CREATOR,
            OR: [
                { username: { contains: query, mode: 'insensitive' as any } },
                { displayName: { contains: query, mode: 'insensitive' as any } },
                { bio: { contains: query, mode: 'insensitive' as any } },
                { archetype: { contains: query, mode: 'insensitive' as any } },
            ],
        };

        const total = await prisma.user.count({ where });

        const creators = await prisma.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                livingChapters: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                createdTiers: {
                    where: { isActive: true },
                    orderBy: { price: 'asc' },
                },
            },
            orderBy: { subscriberCount: 'desc' },
        });

        const mappedCreators = creators.map((creator) => this.mapCreatorToFrontend(creator));

        return {
            creators: mappedCreators,
            hasMore: (page * limit) < total,
            total,
        };
    }

    /**
     * Get detailed creator profile
     */
    async getCreatorProfile(creatorId: string) {
        const creator = await prisma.user.findUnique({
            where: { id: creatorId },
            include: {
                livingChapters: {
                    orderBy: { createdAt: 'desc' },
                },
                createdTiers: {
                    where: { isActive: true },
                    orderBy: { price: 'asc' },
                },
                creatorSubscriptions: {
                    where: { status: 'active' },
                },
            },
        });

        if (!creator || creator.role !== UserRole.CREATOR) {
            throw new Error('Creator not found');
        }

        return this.mapCreatorToFrontend(creator);
    }

    /**
     * Calculate relevance scores for personalization
     */
    private calculateRelevanceScores(creators: any[], interests: string[]): any[] {
        return creators
            .map((creator) => {
                let score = 0;

                // Match interests with categories
                const matchedCategories = creator.categories?.filter((cat: string) =>
                    interests.includes(cat)
                ).length || 0;
                score += matchedCategories * 10;

                // Boost featured creators
                if (creator.isFeatured) score += 5;

                // Boost highly rated creators
                if (creator.avgRating && creator.avgRating >= 4.8) score += 3;

                // Boost trending creators
                if (creator.trendingScore > 80) score += 7;

                return { ...creator, relevanceScore: score };
            })
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Map backend User model to frontend Creator type
     */
    private mapCreatorToFrontend(creator: any) {
        return {
            id: creator.id,
            username: creator.username || creator.email.split('@')[0],
            displayName: creator.displayName || creator.name || 'Anonymous Creator',
            verified: creator.role === UserRole.CREATOR,
            archetype: creator.archetype || 'The Explorer',
            location: creator.location || 'Unknown',
            bio: creator.bio || 'No bio available',
            coverImage: creator.coverImage || '/default-cover.jpg',
            previewVideo: creator.profileVideo,
            avatar: creator.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.displayName || 'User')}&background=008B8B&color=fff`,
            subscriberCount: creator.subscriberCount || 0,
            metrics: {
                happiness: this.calculateHappiness(creator),
                careerPercentile: this.calculateCareerPercentile(creator),
                authenticityScore: this.calculateAuthenticity(creator),
                prediction: this.generatePrediction(creator),
                predictionConfidence: 75,
            },
            chapters: (creator.livingChapters || []).map((chapter: any) => ({
                id: chapter.id,
                title: chapter.title,
                thumbnail: '/default-chapter.jpg', // TODO: Add thumbnail field
                isFree: true, // TODO: Determine based on access level
                duration: '5 min read',
            })),
            tiers: (creator.createdTiers || []).map((tier: any) => ({
                id: tier.id,
                name: tier.name,
                price: tier.price,
                features: JSON.parse(tier.features || '[]'),
                isPopular: tier.price === 19.99, // Middle tier
            })),
            rating: creator.avgRating || undefined,
            reviewCount: creator.reviewCount || 0,
            trendingRank: this.calculateTrendingRank(creator),
            isFeatured: creator.isFeatured || false,
            urgencyOffer: creator.urgencyOffer || undefined,
        };
    }

    /**
     * Calculate happiness score (placeholder)
     */
    private calculateHappiness(creator: any): number {
        // TODO: Implement actual calculation based on content sentiment
        return Math.random() * 2 + 7.5; // 7.5-9.5
    }

    /**
     * Calculate career percentile (placeholder)
     */
    private calculateCareerPercentile(creator: any): number {
        // TODO: Implement actual calculation
        const base = creator.subscriberCount || 0;
        return Math.min(Math.floor(base / 50) + 50, 99);
    }

    /**
     * Calculate authenticity score (placeholder)
     */
    private calculateAuthenticity(creator: any): number {
        // TODO: Implement actual calculation based on engagement
        return Math.random() * 10 + 85; // 85-95
    }

    /**
     * Generate AI prediction (placeholder)
     */
    private generatePrediction(creator: any): string {
        const predictions = [
            'Likely to reach 10K subscribers in next 6 months',
            'High potential for viral content',
            'Strong community engagement trajectory',
            'Predicted to launch premium tier soon',
        ];
        return predictions[Math.floor(Math.random() * predictions.length)];
    }

    /**
     * Calculate trending rank
     */
    private calculateTrendingRank(creator: any): number | undefined {
        if (creator.trendingScore > 90) return 1;
        if (creator.trendingScore > 85) return 2;
        if (creator.trendingScore > 80) return 3;
        return undefined;
    }
}

export const discoveryService = new DiscoveryService();
