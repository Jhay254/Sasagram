import { Creator, FilterTab, Category, UserPreferences } from '../types/discovery.types';
import {
    fetchDiscoveryCreators,
    searchDiscoveryCreators,
    getAuthToken
} from '../api/discovery.api';

/**
 * Service for fetching and filtering creators based on user preferences
 */

// Mock API base URL - replace with actual backend endpoint
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface FetchCreatorsParams {
    tab: FilterTab;
    category?: Category;
    preferences?: UserPreferences;
    page?: number;
    limit?: number;
}

export interface FetchCreatorsResponse {
    creators: Creator[];
    hasMore: boolean;
    total: number;
}

/**
 * Fetch creators based on filter tab and user preferences
 */
export async function fetchCreators(params: FetchCreatorsParams): Promise<FetchCreatorsResponse> {
    const { tab, category, preferences, page = 1, limit = 10 } = params;

    try {
        const token = getAuthToken();

        const response = await fetchDiscoveryCreators({
            tab,
            category,
            preferences,
            page,
            limit,
            token: token || undefined,
        });

        return response;
    } catch (error) {
        console.error('Error fetching creators:', error);

        // Fallback to mock data if API fails (for development)
        if (process.env.NODE_ENV === 'development') {
            console.warn('Falling back to mock data');
            return getMockCreators(params);
        }

        throw error;
    }
}

/**
 * Search creators by query
 */
export async function searchCreators(query: string, page = 1, limit = 10): Promise<FetchCreatorsResponse> {
    try {
        const token = getAuthToken();

        const response = await searchDiscoveryCreators(query, page, limit, token || undefined);

        return response;
    } catch (error) {
        console.error('Error searching creators:', error);

        // Fallback to mock data if API fails (for development)
        if (process.env.NODE_ENV === 'development') {
            console.warn('Falling back to mock data for search');
            return getMockCreators({ tab: 'for-you', page, limit });
        }

        throw error;
    }
}

/**
 * Mock data generator - replace with actual API calls
 */
function getMockCreators(params: FetchCreatorsParams): FetchCreatorsResponse {
    const { tab, category, preferences, page = 1, limit = 10 } = params;

    // Generate mock creators based on filters
    const mockCreators: Creator[] = generateMockCreators(tab, category, preferences);

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCreators = mockCreators.slice(startIndex, endIndex);

    return {
        creators: paginatedCreators,
        hasMore: endIndex < mockCreators.length,
        total: mockCreators.length,
    };
}

/**
 * Generate mock creators based on filter criteria
 */
function generateMockCreators(
    tab: FilterTab,
    category?: Category,
    preferences?: UserPreferences
): Creator[] {
    const baseCreators: Creator[] = [
        {
            id: '1',
            username: 'sarahjohnson',
            displayName: 'Sarah Johnson',
            verified: true,
            archetype: 'The Steady Climber',
            location: 'New York',
            bio: 'From corporate burnout to 7-figure founder. My 3-year journey of building a SaaS company while raising twins. Real talk: the highs, lows, and everything in between.',
            coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop',
            previewVideo: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
            subscriberCount: 2345,
            metrics: {
                happiness: 8.2,
                careerPercentile: 87,
                authenticityScore: 92,
                prediction: 'Likely to scale to $50M in next 18 months',
                predictionConfidence: 75,
            },
            chapters: [
                { id: 'c1', title: 'The Burnout', thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=300&fit=crop', isFree: true },
                { id: 'c2', title: 'NYC Move', thumbnail: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=200&h=300&fit=crop', isFree: true },
                { id: 'c3', title: 'First $1M', thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&h=300&fit=crop', isFree: false, price: 19.99 },
                { id: 'c4', title: 'Scaling Up', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=300&fit=crop', isFree: false, price: 19.99 },
            ],
            tiers: [
                { id: 't1', name: 'Basic', price: 9.99, features: ['All chapters'] },
                { id: 't2', name: 'Plus', price: 19.99, features: ['All chapters', 'Predictions', 'Stats'], isPopular: true },
                { id: 't3', name: 'Vision', price: 49.99, features: ['All chapters', 'Predictions', 'Stats', 'Shadow Self', 'AI Q&A'] },
            ],
            rating: 4.9,
            reviewCount: 234,
            trendingRank: 3,
            isFeatured: true,
            urgencyOffer: {
                type: 'limited-time',
                message: '🔥 50% off first month - Limited time offer!',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
            },
        },
        {
            id: '2',
            username: 'mikaartist',
            displayName: 'Mika Chen',
            verified: true,
            archetype: 'The Late Bloomer',
            location: 'Brooklyn',
            bio: 'Started painting at 40. Now in MOMA. The journey from corporate lawyer to full-time artist. Proving it\'s never too late to follow your passion.',
            coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
            subscriberCount: 1823,
            metrics: {
                happiness: 9.1,
                careerPercentile: 72,
                authenticityScore: 95,
                prediction: 'Next solo exhibition likely in 6 months',
                predictionConfidence: 82,
            },
            chapters: [
                { id: 'c5', title: 'The Decision', thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=200&h=300&fit=crop', isFree: true },
                { id: 'c6', title: 'First Gallery', thumbnail: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=200&h=300&fit=crop', isFree: true },
                { id: 'c7', title: 'MOMA Acceptance', thumbnail: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=200&h=300&fit=crop', isFree: false, price: 14.99 },
            ],
            tiers: [
                { id: 't4', name: 'Basic', price: 9.99, features: ['All chapters'] },
                { id: 't5', name: 'Plus', price: 14.99, features: ['All chapters', 'Predictions', 'Stats'], isPopular: true },
                { id: 't6', name: 'Vision', price: 39.99, features: ['All chapters', 'Predictions', 'Stats', 'Shadow Self', 'AI Q&A'] },
            ],
            rating: 4.8,
            reviewCount: 156,
            isFeatured: false,
        },
        {
            id: '3',
            username: 'fitjohn',
            displayName: 'John Martinez',
            verified: true,
            archetype: 'The Transformer',
            location: 'Austin',
            bio: 'From 300lbs to Ironman finisher. The physical and mental transformation you won\'t see on Instagram. Real struggles, real victories.',
            coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop',
            avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
            subscriberCount: 2567,
            metrics: {
                happiness: 8.7,
                careerPercentile: 65,
                authenticityScore: 88,
                prediction: 'Will complete Ultra Marathon in next year',
                predictionConfidence: 70,
            },
            chapters: [
                { id: 'c8', title: 'Rock Bottom', thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=300&fit=crop', isFree: true },
                { id: 'c9', title: 'First 5K', thumbnail: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=200&h=300&fit=crop', isFree: true },
                { id: 'c10', title: 'Ironman Day', thumbnail: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&h=300&fit=crop', isFree: false, price: 19.99 },
            ],
            tiers: [
                { id: 't7', name: 'Basic', price: 9.99, features: ['All chapters'] },
                { id: 't8', name: 'Plus', price: 19.99, features: ['All chapters', 'Predictions', 'Stats'], isPopular: true },
                { id: 't9', name: 'Vision', price: 44.99, features: ['All chapters', 'Predictions', 'Stats', 'Shadow Self', 'AI Q&A'] },
            ],
            rating: 4.9,
            reviewCount: 312,
            trendingRank: 1,
            isFeatured: true,
            urgencyOffer: {
                type: 'limited-spots',
                message: '⚡ Only 3 spots left at this price!',
            },
        },
    ];

    // Filter based on tab
    let filteredCreators = [...baseCreators];

    if (tab === 'trending') {
        filteredCreators = filteredCreators
            .filter((c) => c.trendingRank)
            .sort((a, b) => (a.trendingRank || 999) - (b.trendingRank || 999));
    } else if (tab === 'new') {
        // In real app, filter by creation date
        filteredCreators = filteredCreators.reverse();
    } else if (tab === 'for-you' && preferences) {
        // Personalized filtering based on interests
        // In real app, this would use ML/recommendation algorithm
        filteredCreators = filteredCreators.sort((a, b) => {
            const aScore = calculateRelevanceScore(a, preferences);
            const bScore = calculateRelevanceScore(b, preferences);
            return bScore - aScore;
        });
    }

    // Filter by category if specified
    if (category) {
        filteredCreators = filteredCreators.filter((creator) => {
            // In real app, creators would have category tags
            // For now, simple keyword matching
            const categoryKeywords = getCategoryKeywords(category);
            return categoryKeywords.some((keyword) =>
                creator.bio.toLowerCase().includes(keyword) ||
                creator.archetype.toLowerCase().includes(keyword)
            );
        });
    }

    return filteredCreators;
}

/**
 * Calculate relevance score for "For You" personalization
 */
function calculateRelevanceScore(creator: Creator, preferences: UserPreferences): number {
    let score = 0;

    // Match interests (simplified - in real app would use embeddings/ML)
    const categoryKeywords = preferences.interests.flatMap(getCategoryKeywords);
    const bioLower = creator.bio.toLowerCase();
    const archetypeLower = creator.archetype.toLowerCase();

    categoryKeywords.forEach((keyword) => {
        if (bioLower.includes(keyword) || archetypeLower.includes(keyword)) {
            score += 10;
        }
    });

    // Boost featured creators
    if (creator.isFeatured) score += 5;

    // Boost highly rated creators
    if (creator.rating && creator.rating >= 4.8) score += 3;

    // Boost trending creators
    if (creator.trendingRank && creator.trendingRank <= 5) score += 7;

    return score;
}

/**
 * Get keywords associated with each category
 */
function getCategoryKeywords(category: Category): string[] {
    const keywordMap: Record<Category, string[]> = {
        'career-business': ['founder', 'entrepreneur', 'business', 'startup', 'career', 'corporate', 'saas'],
        'creative-arts': ['artist', 'painting', 'creative', 'gallery', 'moma', 'art'],
        'health-fitness': ['fitness', 'ironman', 'marathon', 'health', 'transformation', 'weight'],
        'travel-adventure': ['travel', 'adventure', 'explore', 'journey', 'world'],
        'personal-growth': ['growth', 'transformation', 'journey', 'development'],
        'relationships-family': ['family', 'relationship', 'twins', 'parent', 'marriage'],
        'education-learning': ['education', 'learning', 'teaching', 'student'],
        'gaming-entertainment': ['gaming', 'entertainment', 'streamer', 'content'],
        'technology-innovation': ['technology', 'tech', 'innovation', 'ai', 'software'],
        'lifestyle-culture': ['lifestyle', 'culture', 'living', 'urban'],
    };

    return keywordMap[category] || [];
}
