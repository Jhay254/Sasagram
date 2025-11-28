import prisma from '../db/prisma';

interface NormalizedPost {
    content: string;
    createdAt: Date;
    location?: string;
    latitude?: number;
    longitude?: number;
    url?: string;
    metadata: any;
}

interface NormalizedMedia {
    type: 'PHOTO' | 'VIDEO';
    url: string;
    createdAt: Date;
    location?: string;
    latitude?: number;
    longitude?: number;
    metadata: any;
}

interface NormalizedEmail {
    subject: string;
    sender: string;
    recipients: string[];
    receivedAt: Date;
    category: string;
}

/**
 * Data normalization and enrichment service
 * Standardizes data from different providers
 */
export class DataNormalizerService {
    /**
     * Normalize social post from any provider
     */
    static normalizePost(rawData: any, provider: string): NormalizedPost {
        const normalized: NormalizedPost = {
            content: '',
            createdAt: new Date(),
            metadata: {},
        };

        switch (provider) {
            case 'INSTAGRAM':
                normalized.content = rawData.caption || '';
                normalized.createdAt = new Date(rawData.timestamp);
                normalized.url = rawData.permalink;
                normalized.metadata = {
                    mediaType: rawData.media_type,
                    likes: rawData.like_count,
                };
                if (rawData.location) {
                    normalized.location = rawData.location.name;
                    normalized.latitude = rawData.location.latitude;
                    normalized.longitude = rawData.location.longitude;
                }
                break;

            case 'TWITTER':
                normalized.content = rawData.text || '';
                normalized.createdAt = rawData.created_at ? new Date(rawData.created_at) : new Date();
                normalized.url = `https://twitter.com/user/status/${rawData.id}`;
                normalized.metadata = {
                    publicMetrics: rawData.public_metrics,
                    entities: rawData.entities,
                };
                break;

            case 'FACEBOOK':
                normalized.content = rawData.message || rawData.story || '';
                normalized.createdAt = new Date(rawData.created_time);
                normalized.url = `https://facebook.com/${rawData.id}`;
                normalized.metadata = {
                    type: rawData.type,
                    likes: rawData.likes?.summary?.total_count,
                };
                break;

            case 'LINKEDIN':
                normalized.content = rawData.text || '';
                normalized.createdAt = new Date(rawData.createdAt);
                normalized.url = rawData.shareUrl;
                normalized.metadata = {
                    visibility: rawData.visibility,
                };
                break;

            default:
                console.warn(`Unknown provider: ${provider}`);
        }

        // Sanitize content (remove PII, etc.)
        normalized.content = this.sanitizeContent(normalized.content);

        return normalized;
    }

    /**
     * Normalize media item from any provider
     */
    static normalizeMedia(rawData: any, provider: string): NormalizedMedia {
        const normalized: NormalizedMedia = {
            type: 'PHOTO',
            url: '',
            createdAt: new Date(),
            metadata: {},
        };

        switch (provider) {
            case 'INSTAGRAM':
                normalized.type = rawData.media_type === 'VIDEO' ? 'VIDEO' : 'PHOTO';
                normalized.url = rawData.media_url;
                normalized.createdAt = new Date(rawData.timestamp);
                normalized.metadata = {
                    caption: rawData.caption,
                    permalink: rawData.permalink,
                };
                if (rawData.location) {
                    normalized.location = rawData.location.name;
                    normalized.latitude = rawData.location.latitude;
                    normalized.longitude = rawData.location.longitude;
                }
                break;

            case 'TWITTER':
                // Twitter media from attachments
                normalized.type = rawData.type === 'video' ? 'VIDEO' : 'PHOTO';
                normalized.url = rawData.url || rawData.preview_image_url;
                normalized.createdAt = new Date();
                normalized.metadata = {
                    mediaKey: rawData.media_key,
                };
                break;

            default:
                console.warn(`Unknown provider: ${provider}`);
        }

        return normalized;
    }

    /**
     * Normalize email metadata
     */
    static normalizeEmail(rawData: any): NormalizedEmail {
        const headers = rawData.payload?.headers || [];
        const getHeader = (name: string) =>
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const subject = getHeader('Subject');
        const from = getHeader('From');
        const to = getHeader('To');
        const date = getHeader('Date');

        return {
            subject,
            sender: from,
            recipients: to.split(',').map((r: string) => r.trim()),
            receivedAt: date ? new Date(date) : new Date(),
            category: this.categorizeEmail(subject),
        };
    }

    /**
     * Categorize email based on subject and content
     */
    private static categorizeEmail(subject: string): string {
        const lower = subject.toLowerCase();

        if (lower.includes('flight') || lower.includes('airline') || lower.includes('boarding')) {
            return 'TRAVEL_FLIGHT';
        }
        if (lower.includes('hotel') || lower.includes('accommodation') || lower.includes('booking.com')) {
            return 'TRAVEL_HOTEL';
        }
        if (lower.includes('ticket') || lower.includes('event') || lower.includes('concert')) {
            return 'EVENT_TICKET';
        }
        if (lower.includes('reservation') || lower.includes('booking') || lower.includes('confirmation')) {
            return 'BOOKING';
        }
        if (lower.includes('conference') || lower.includes('meeting') || lower.includes('calendar')) {
            return 'PROFESSIONAL';
        }

        return 'OTHER';
    }

    /**
     * Sanitize content (remove PII, clean text)
     */
    private static sanitizeContent(content: string): string {
        if (!content) return '';

        let sanitized = content;

        // Remove email addresses (basic pattern)
        sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]');

        // Remove phone numbers (US format)
        sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]');

        // Remove credit card numbers (basic pattern)
        sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[card]');

        // Remove SSN (basic pattern)
        sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]');

        // Trim whitespace
        sanitized = sanitized.trim();

        return sanitized;
    }

    /**
     * Enrich location data (convert place name to coordinates)
     */
    static async enrichLocation(placeName: string): Promise<{ latitude: number; longitude: number } | null> {
        // TODO: Integrate with geocoding service (Google Maps, Mapbox, etc.)
        // For now, return null
        // Example implementation:
        // const response = await geocodingService.geocode(placeName);
        // return { latitude: response.lat, longitude: response.lng };

        console.log(`Location enrichment not yet implemented for: ${placeName}`);
        return null;
    }

    /**
     * Extract date from content using NLP
     */
    static extractDates(content: string): Date[] {
        const dates: Date[] = [];

        // Basic date patterns (can be enhanced with NLP libraries)
        const patterns = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // MM/DD/YYYY
            /(\d{4})-(\d{1,2})-(\d{1,2})/g,   // YYYY-MM-DD
        ];

        for (const pattern of patterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                try {
                    const date = new Date(match[0]);
                    if (!isNaN(date.getTime())) {
                        dates.push(date);
                    }
                } catch (error) {
                    // Invalid date, skip
                }
            }
        }

        return dates;
    }

    /**
     * Extract mentions from content
     */
    static extractMentions(content: string): string[] {
        const mentions: string[] = [];

        // @ mentions
        const atMentions = content.match(/@[\w.]+/g) || [];
        mentions.push(...atMentions.map(m => m.substring(1)));

        // Email addresses
        const emails = content.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
        mentions.push(...emails);

        return [...new Set(mentions)]; // Remove duplicates
    }

    /**
     * Detect duplicate content (using simple hash)
     */
    static async isDuplicate(dataSourceId: string, content: string): Promise<boolean> {
        // Create simple hash of content
        const hash = this.simpleHash(content);

        // Check if hash exists in database
        const existing = await prisma.socialPost.findFirst({
            where: {
                dataSourceId,
                content: {
                    contains: hash.substring(0, 20), // Use first 20 chars for matching
                },
            },
        });

        return !!existing;
    }

    /**
     * Simple string hash function
     */
    private static simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
}
