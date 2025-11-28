import prisma from '../db/prisma';

export class SharingService {
    /**
     * Generate share URL for biography
     */
    static generateBiographyShareUrl(biographyId: string): string {
        const baseUrl = process.env.FRONTEND_URL || 'https://lifeline.app';
        return `${baseUrl}/biography/${biographyId}`;
    }

    /**
     * Generate share URL for user profile
     */
    static generateProfileShareUrl(userId: string): string {
        const baseUrl = process.env.FRONTEND_URL || 'https://lifeline.app';
        return `${baseUrl}/profile/${userId}`;
    }

    /**
     * Generate deep link for mobile app
     */
    static generateDeepLink(type: 'biography' | 'profile', id: string): string {
        return `lifeline://${type}/${id}`;
    }

    /**
     * Get Open Graph metadata for biography
     */
    static async getBiographyOgMetadata(biographyId: string) {
        const biography = await prisma.biography.findUnique({
            where: { id: biographyId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        displayName: true,
                    },
                },
            },
        });

        if (!biography) {
            throw new Error('Biography not found');
        }

        const authorName = biography.user.displayName ||
            `${biography.user.firstName} ${biography.user.lastName}`;

        return {
            title: biography.title,
            description: biography.description || `Read ${authorName}'s biography on Lifeline`,
            image: biography.coverImageUrl || `${process.env.FRONTEND_URL}/default-biography-cover.jpg`,
            url: this.generateBiographyShareUrl(biographyId),
            type: 'article',
            siteName: 'Lifeline',
            author: authorName,
        };
    }

    /**
     * Get Open Graph metadata for user profile
     */
    static async getProfileOgMetadata(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                firstName: true,
                lastName: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                followerCount: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const name = user.displayName || `${user.firstName} ${user.lastName}`;

        return {
            title: `${name} on Lifeline`,
            description: user.bio || `Check out ${name}'s profile and biographies on Lifeline`,
            image: user.avatarUrl || `${process.env.FRONTEND_URL}/default-avatar.jpg`,
            url: this.generateProfileShareUrl(userId),
            type: 'profile',
            siteName: 'Lifeline',
            profileUsername: user.displayName,
        };
    }

    /**
     * Track share activity
     */
    static async trackShare(
        userId: string,
        targetType: 'biography' | 'profile',
        targetId: string,
        platform?: string
    ) {
        try {
            await prisma.userActivity.create({
                data: {
                    userId,
                    activityType: 'SHARE_BIOGRAPHY',
                    targetId,
                    metadata: {
                        targetType,
                        platform: platform || 'unknown',
                    },
                },
            });

            // Increment share count if biography
            if (targetType === 'biography') {
                await prisma.biography.update({
                    where: { id: targetId },
                    data: { shareCount: { increment: 1 } },
                });
            }
        } catch (error) {
            console.error('Error tracking share:', error);
        }
    }

    /**
     * Generate social media share URLs
     */
    static generateSocialShareUrls(url: string, title: string, description?: string) {
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        const encodedDesc = description ? encodeURIComponent(description) : '';

        return {
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
            email: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`,
        };
    }
}
