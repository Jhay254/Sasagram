/**
 * Type definitions for Sasagram Discovery Feed
 */

export interface Creator {
    id: string;
    username: string;
    displayName: string;
    verified: boolean;
    archetype: string;
    location: string;
    bio: string;
    coverImage: string;
    previewVideo?: string;
    avatar: string;
    subscriberCount: number;
    metrics: LifeMetrics;
    chapters: Chapter[];
    tiers: SubscriptionTier[];
    rating?: number;
    reviewCount?: number;
    trendingRank?: number;
    isFeatured?: boolean;
    urgencyOffer?: UrgencyOffer;
}

export interface LifeMetrics {
    happiness: number; // 0-10 scale
    careerPercentile: number; // 0-100
    authenticityScore: number; // 0-100
    prediction?: string;
    predictionConfidence?: number; // 0-100
}

export interface Chapter {
    id: string;
    title: string;
    thumbnail: string;
    isFree: boolean;
    price?: number;
    duration?: string; // e.g., "5 min read"
    excerpt?: string;
}

export interface SubscriptionTier {
    id: string;
    name: 'Basic' | 'Plus' | 'Vision';
    price: number;
    features: string[];
    isPopular?: boolean;
}

export type FilterTab = 'for-you' | 'trending' | 'new' | 'category';

export type Category =
    | 'career-business'
    | 'creative-arts'
    | 'health-fitness'
    | 'travel-adventure'
    | 'personal-growth'
    | 'relationships-family'
    | 'education-learning'
    | 'gaming-entertainment'
    | 'technology-innovation'
    | 'lifestyle-culture';

export interface UserPreferences {
    interests: Category[];
    lifeStage: 'student' | 'early-career' | 'mid-career' | 'peak-career' | 'late-career';
    completedOnboarding: boolean;
}

export interface SearchSuggestion {
    id: string;
    text: string;
    type: 'creator' | 'topic' | 'archetype';
}

export interface UrgencyOffer {
    type: 'limited-time' | 'limited-spots' | 'recent-activity';
    message: string;
    expiresAt?: string; // ISO string for JSON compatibility
    countdown?: number; // seconds remaining
}
