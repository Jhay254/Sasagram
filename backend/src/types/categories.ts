/**
 * Primary categories for biography events
 */
export enum BiographyCategory {
    EARLY_LIFE = 'Early Life',
    EDUCATION = 'Education',
    CAREER = 'Career',
    FAMILY = 'Family & Relationships',
    TRAVEL = 'Travel & Adventure',
    HOBBIES = 'Hobbies & Interests',
    ACHIEVEMENTS = 'Achievements & Awards',
    SOCIAL = 'Social Life',
    HEALTH = 'Health & Wellness',
    SPIRITUALITY = 'Spirituality & Beliefs',
    SIGNIFICANT_EVENTS = 'Significant Life Events',
    DAILY_LIFE = 'Daily Life',
    OTHER = 'Other',
}

/**
 * Common tags for finer granularity
 */
export const COMMON_TAGS = [
    'Birth', 'School', 'University', 'Graduation',
    'First Job', 'Promotion', 'New Job', 'Retirement',
    'Dating', 'Marriage', 'Divorce', 'Children', 'Pet',
    'Vacation', 'Relocation', 'Home Purchase',
    'Concert', 'Festival', 'Sports', 'Art',
    'Illness', 'Recovery',
    'Loss', 'Celebration',
];

/**
 * Interface for AI categorization result
 */
export interface CategorizationResult {
    category: BiographyCategory;
    confidence: number;
    tags: string[];
    reasoning: string;
}
