import prisma from '../db/prisma';
import { DeepfakeDetectionService } from './deepfake-detection.service';

/**
 * Trust Badge Service - Tiered badge system
 * Levels: BRONZE → SILVER → GOLD → PLATINUM
 */
export class TrustBadgeService {
    private deepfakeService: DeepfakeDetectionService;

    constructor() {
        this.deepfakeService = new DeepfakeDetectionService();
    }

    /**
     * Calculate and award badges for a user
     */
    async calculateAndAwardBadges(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                blockchainVerifications: {
                    where: { status: 'VERIFIED' },
                },
                deepfakeAnalyses: true,
                trustBadges: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const verifiedCount = user.blockchainVerifications.length;
        const deepfakeStats = await this.deepfakeService.getUserDeepfakeStats(userId);

        const badges: Array<{
            level: string;
            category: string;
            earnedBy: string;
        }> = [];

        // BRONZE: 5+ verified items
        if (verifiedCount >= 5 && !this.hasBadge(user.trustBadges, 'BRONZE', 'VERIFIED_CONTENT')) {
            badges.push({
                level: 'BRONZE',
                category: 'VERIFIED_CONTENT',
                earnedBy: `Achieved ${verifiedCount} blockchain-verified items`,
            });
        }

        // SILVER: 25+ verified items + 90%+ authentic
        if (
            verifiedCount >= 25 &&
            deepfakeStats.authenticityScore >= 0.9 &&
            !this.hasBadge(user.trustBadges, 'SILVER', 'DEEPFAKE_FREE')
        ) {
            badges.push({
                level: 'SILVER',
                category: 'DEEPFAKE_FREE',
                earnedBy: `${verifiedCount} verified items with ${(deepfakeStats.authenticityScore * 100).toFixed(1)}% authenticity score`,
            });
        }

        // GOLD: 100+ verified items + 95%+ authentic
        if (
            verifiedCount >= 100 &&
            deepfakeStats.authenticityScore >= 0.95 &&
            !this.hasBadge(user.trustBadges, 'GOLD', 'VERIFIED_CONTENT')
        ) {
            badges.push({
                level: 'GOLD',
                category: 'VERIFIED_CONTENT',
                earnedBy: `Elite status: ${verifiedCount} verified items with ${(deepfakeStats.authenticityScore * 100).toFixed(1)}% authenticity`,
            });
        }

        // PLATINUM: 500+ verified items + 99%+ authentic (manual verification required)
        // Note: Platinum requires manual team approval, so we don't auto-award it here

        // Award new badges
        for (const badge of badges) {
            await this.awardBadge(userId, badge.level, badge.category, badge.earnedBy, verifiedCount, deepfakeStats.authenticityScore);
        }

        return badges;
    }

    /**
     * Award a badge to a user
     */
    async awardBadge(
        userId: string,
        level: string,
        category: string,
        earnedBy: string,
        verificationCount: number,
        deepfakeScore: number
    ) {
        const badge = await prisma.trustBadge.create({
            data: {
                userId,
                level,
                category,
                earnedBy,
                verificationCount,
                deepfakeScore,
                isActive: true,
            },
        });

        // TODO: Send notification to user
        console.log(`Badge awarded: ${level} - ${category} to user ${userId}`);

        return badge;
    }

    /**
     * Get user's active badges
     */
    async getUserBadges(userId: string) {
        return await prisma.trustBadge.findMany({
            where: {
                userId,
                isActive: true,
            },
            orderBy: [{ displayOrder: 'asc' }, { earnedAt: 'desc' }],
        });
    }

    /**
     * Get badge earning criteria
     */
    getBadgeCriteria() {
        return {
            BRONZE: {
                level: 'BRONZE',
                requirements: {
                    verifiedItems: 5,
                    authenticityScore: null,
                },
                description: 'Entry level verification - 5+ blockchain-verified items',
                benefits: ['Verification badge on profile', 'Public trust indicator'],
            },
            SILVER: {
                level: 'SILVER',
                requirements: {
                    verifiedItems: 25,
                    authenticityScore: 0.9, // 90%+
                },
                description: 'Intermediate verification - 25+ verified items with 90%+ authenticity',
                benefits: ['Enhanced profile badge', 'Priority support', 'Reduced fees'],
            },
            GOLD: {
                level: 'GOLD',
                requirements: {
                    verifiedItems: 100,
                    authenticityScore: 0.95, // 95%+
                },
                description: 'Advanced verification - 100+ verified items with 95%+ authenticity',
                benefits: ['Gold badge', 'VIP features', 'API access', 'Featured creator'],
            },
            PLATINUM: {
                level: 'PLATINUM',
                requirements: {
                    verifiedItems: 500,
                    authenticityScore: 0.99, // 99%+
                    manualApproval: true,
                },
                description: 'Elite verification - 500+ verified items with 99%+ authenticity + manual review',
                benefits: [
                    'Platinum badge',
                    'Exclusive features',
                    'Revenue sharing program',
                    'Direct team support',
                    'Conference invitations',
                ],
            },
        };
    }

    /**
     * Get user's progress to next badge level
     */
    async getBadgeProgress(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                blockchainVerifications: { where: { status: 'VERIFIED' } },
                trustBadges: { where: { isActive: true } },
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const verifiedCount = user.blockchainVerifications.length;
        const deepfakeStats = await this.deepfakeService.getUserDeepfakeStats(userId);

        const currentLevel = this.getCurrentBadgeLevel(user.trustBadges);
        const nextLevel = this.getNextLevel(currentLevel);

        if (!nextLevel) {
            return {
                currentLevel: 'PLATINUM',
                nextLevel: null,
                progress: 100,
                message: 'Maximum badge level achieved!',
            };
        }

        const criteria = this.getBadgeCriteria()[nextLevel];
        const verificationProgress = (verifiedCount / criteria.requirements.verifiedItems) * 100;
        const authenticityProgress = criteria.requirements.authenticityScore
            ? (deepfakeStats.authenticityScore / criteria.requirements.authenticityScore) * 100
            : 100;

        const overallProgress = Math.min((verificationProgress + authenticityProgress) / 2, 100);

        return {
            currentLevel,
            nextLevel,
            progress: Math.round(overallProgress),
            requirements: {
                verifiedItems: {
                    current: verifiedCount,
                    required: criteria.requirements.verifiedItems,
                    progress: Math.min(verificationProgress, 100),
                },
                authenticityScore: criteria.requirements.authenticityScore
                    ? {
                        current: deepfakeStats.authenticityScore,
                        required: criteria.requirements.authenticityScore,
                        progress: Math.min(authenticityProgress, 100),
                    }
                    : null,
            },
        };
    }

    // ========== Private Helper Methods ==========

    private hasBadge(badges: any[], level: string, category: string): boolean {
        return badges.some((b) => b.level === level && b.category === category && b.isActive);
    }

    private getCurrentBadgeLevel(badges: any[]): string | null {
        const levels = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];
        for (const level of levels) {
            if (badges.some((b) => b.level === level && b.isActive)) {
                return level;
            }
        }
        return null;
    }

    private getNextLevel(currentLevel: string | null): string | null {
        const progression: Record<string, string> = {
            null: 'BRONZE',
            BRONZE: 'SILVER',
            SILVER: 'GOLD',
            GOLD: 'PLATINUM',
            PLATINUM: null as any,
        };
        return progression[currentLevel || 'null'];
    }
}
