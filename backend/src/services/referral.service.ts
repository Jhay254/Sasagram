import prisma from '../db/prisma';
import { ReferralStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

interface ReferralStats {
    code: string;
    clicks: number;
    signups: number;
    conversions: number;
    conversionRate: number;
    totalEarnings: number;
    pendingRewards: number;
}

interface TrackingMetadata {
    sourceUrl?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    ipAddress?: string;
    userAgent?: string;
}

export class ReferralService {
    /**
     * Generate a unique referral code for a user
     */
    static async generateReferralCode(userId: string): Promise<string> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, displayName: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Generate code from name + random suffix
        const base = (user.displayName || user.firstName || 'USER')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 8);

        const suffix = nanoid(4).toUpperCase(); // Random 4-char suffix
        let code = `${base}-${suffix}`;

        // Ensure uniqueness
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.referralCode.findUnique({
                where: { code },
            });

            if (!existing) break;

            // Generate new suffix
            const newSuffix = nanoid(4).toUpperCase();
            code = `${base}-${newSuffix}`;
            attempts++;
        }

        // Create referral code record
        const referralCode = await prisma.referralCode.create({
            data: {
                userId,
                code,
            },
        });

        return referralCode.code;
    }

    /**
     * Get or create referral code for a user
     */
    static async getOrCreateReferralCode(userId: string) {
        let referralCode = await prisma.referralCode.findUnique({
            where: { userId },
        });

        if (!referralCode) {
            const code = await this.generateReferralCode(userId);
            referralCode = await prisma.referralCode.findUnique({
                where: { userId },
            });
        }

        return referralCode;
    }

    /**
     * Track a referral link click
     */
    static async trackClick(code: string, metadata: TrackingMetadata = {}): Promise<void> {
        const referralCode = await prisma.referralCode.findUnique({
            where: { code },
            include: { user: true },
        });

        if (!referralCode) {
            console.warn(`Referral code not found: ${code}`);
            return;
        }

        // Check for duplicate click (same IP within 1 hour)
        if (metadata.ipAddress) {
            const recentClick = await prisma.referral.findFirst({
                where: {
                    referralCodeId: referralCode.id,
                    ipAddress: metadata.ipAddress,
                    clickedAt: {
                        gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
                    },
                },
            });

            if (recentClick) {
                return; // Don't count duplicate clicks
            }
        }

        // Create referral record (PENDING status)
        await prisma.referral.create({
            data: {
                referrerId: referralCode.userId,
                referralCodeId: referralCode.id,
                status: ReferralStatus.PENDING,
                sourceUrl: metadata.sourceUrl,
                utmSource: metadata.utmSource,
                utmMedium: metadata.utmMedium,
                utmCampaign: metadata.utmCampaign,
                ipAddress: metadata.ipAddress,
                userAgent: metadata.userAgent,
            },
        });

        // Increment click count
        await prisma.referralCode.update({
            where: { id: referralCode.id },
            data: { clicks: { increment: 1 } },
        });
    }

    /**
     * Track a signup from a referral
     */
    static async trackSignup(refereeId: string, code: string): Promise<void> {
        const referralCode = await prisma.referralCode.findUnique({
            where: { code },
        });

        if (!referralCode) {
            console.warn(`Referral code not found: ${code}`);
            return;
        }

        const referee = await prisma.user.findUnique({
            where: { id: refereeId },
            select: { email: true },
        });

        // Find most recent PENDING referral or create new one
        let referral = await prisma.referral.findFirst({
            where: {
                referralCodeId: referralCode.id,
                status: ReferralStatus.PENDING,
                refereeId: null,
            },
            orderBy: { clickedAt: 'desc' },
        });

        if (referral) {
            // Update existing referral
            await prisma.referral.update({
                where: { id: referral.id },
                data: {
                    refereeId,
                    refereeEmail: referee?.email,
                    status: ReferralStatus.SIGNED_UP,
                    signedUpAt: new Date(),
                },
            });
        } else {
            // Create new referral (direct signup without click tracking)
            referral = await prisma.referral.create({
                data: {
                    referrerId: referralCode.userId,
                    referralCodeId: referralCode.id,
                    refereeId,
                    refereeEmail: referee?.email,
                    status: ReferralStatus.SIGNED_UP,
                    signedUpAt: new Date(),
                },
            });
        }

        // Increment signup count
        await prisma.referralCode.update({
            where: { id: referralCode.id },
            data: { signups: { increment: 1 } },
        });

        // Update referrer stats
        await prisma.user.update({
            where: { id: referralCode.userId },
            data: { totalReferrals: { increment: 1 } },
        });

        // Issue signup rewards
        await this.issueSignupRewards(referral.id);
    }

    /**
     * Track email verification (activation)
     */
    static async trackActivation(userId: string): Promise<void> {
        const referral = await prisma.referral.findFirst({
            where: {
                refereeId: userId,
                status: ReferralStatus.SIGNED_UP,
            },
        });

        if (referral) {
            await prisma.referral.update({
                where: { id: referral.id },
                data: {
                    status: ReferralStatus.ACTIVATED,
                    activatedAt: new Date(),
                },
            });
        }
    }

    /**
     * Track first payment (conversion)
     */
    static async trackConversion(userId: string): Promise<void> {
        const referral = await prisma.referral.findFirst({
            where: {
                refereeId: userId,
                status: { in: [ReferralStatus.SIGNED_UP, ReferralStatus.ACTIVATED] },
            },
        });

        if (referral) {
            await prisma.referral.update({
                where: { id: referral.id },
                data: {
                    status: ReferralStatus.CONVERTED,
                    convertedAt: new Date(),
                },
            });

            // Increment conversion count
            await prisma.referralCode.update({
                where: { id: referral.referralCodeId },
                data: { conversions: { increment: 1 } },
            });

            // Update referrer stats
            await prisma.user.update({
                where: { id: referral.referrerId },
                data: { successfulReferrals: { increment: 1 } },
            });

            // Check milestones
            await this.checkMilestones(referral.referrerId);
        }
    }

    /**
     * Issue rewards for successful signup (both referrer and referee)
     */
    static async issueSignupRewards(referralId: string): Promise<void> {
        const referral = await prisma.referral.findUnique({
            where: { id: referralId },
            include: { referrer: true, referee: true },
        });

        if (!referral || !referral.referee || referral.rewardsIssued) {
            return;
        }

        // Reward 1: Referrer gets 1 month free premium
        await this.issueFreePremium(referral.referrerId, 1, 'Referral reward');

        // Reward 2: Referee gets 1 month free premium
        await this.issueFreePremium(referral.refereeId!, 1, 'Welcome reward');

        // Mark rewards as issued
        await prisma.referral.update({
            where: { id: referralId },
            data: { rewardsIssued: true },
        });
    }

    /**
     * Issue free premium months to a user
     */
    static async issueFreePremium(
        userId: string,
        months: number,
        description: string
    ): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isPremium: true, premiumExpiresAt: true },
        });

        if (!user) return;

        // Calculate new expiry date
        const currentExpiry = user.premiumExpiresAt || new Date();
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + months);

        // Update user premium status
        await prisma.user.update({
            where: { id: userId },
            data: {
                isPremium: true,
                premiumExpiresAt: newExpiry,
            },
        });

        // Create reward record
        await prisma.referralReward.create({
            data: {
                userId,
                type: 'FREE_PREMIUM',
                description,
                premiumMonths: months,
                status: 'ISSUED',
                issuedAt: new Date(),
            },
        });
    }

    /**
     * Calculate revenue share for a referrer
     */
    static async calculateRevenueShare(referrerId: string, amount: number): Promise<number> {
        // Check if referrer has 100+ milestone (25% share)
        const milestone100 = await prisma.referralMilestone.findFirst({
            where: {
                userId: referrerId,
                milestone: { gte: 100 },
                rewardType: 'REVENUE_BOOST',
            },
        });

        const sharePercentage = milestone100 ? 0.25 : 0.10; // 25% or 10%
        const shareAmount = amount * sharePercentage;

        // Create revenue share reward
        await prisma.referralReward.create({
            data: {
                userId: referrerId,
                type: 'REVENUE_SHARE',
                amount: shareAmount,
                description: `${Math.round(sharePercentage * 100)}% revenue share`,
                status: 'PENDING',
            },
        });

        // Update referral code stats
        const referralCode = await prisma.referralCode.findUnique({
            where: { userId: referrerId },
        });

        if (referralCode) {
            await prisma.referralCode.update({
                where: { id: referralCode.id },
                data: {
                    totalRewards: { increment: shareAmount },
                    pendingRewards: { increment: shareAmount },
                },
            });
        }

        // Update user earnings
        await prisma.user.update({
            where: { id: referrerId },
            data: {
                referralEarnings: { increment: shareAmount },
            },
        });

        return shareAmount;
    }

    /**
     * Check and award milestones
     */
    static async checkMilestones(userId: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { successfulReferrals: true },
            include: { referralMilestones: true },
        });

        if (!user) return;

        const milestones = [
            { count: 5, type: 'TEMPLATE', value: 'premium-template-1' },
            { count: 10, type: 'BADGE', value: 'featured-creator' },
            { count: 50, type: 'FREE_PREMIUM', value: '3' },
            { count: 100, type: 'REVENUE_BOOST', value: '25%' },
        ];

        for (const milestone of milestones) {
            if (user.successfulReferrals >= milestone.count) {
                // Check if already achieved
                const exists = user.referralMilestones.some(
                    m => m.milestone === milestone.count
                );

                if (!exists) {
                    // Award milestone
                    await prisma.referralMilestone.create({
                        data: {
                            userId,
                            milestone: milestone.count,
                            rewardType: milestone.type,
                            rewardValue: milestone.value,
                        },
                    });

                    // Issue milestone reward
                    await this.issueMilestoneReward(userId, milestone);
                }
            }
        }
    }

    /**
     * Issue milestone reward
     */
    private static async issueMilestoneReward(
        userId: string,
        milestone: { count: number; type: string; value: string }
    ): Promise<void> {
        if (milestone.type === 'FREE_PREMIUM') {
            const months = parseInt(milestone.value);
            await this.issueFreePremium(userId, months, `${milestone.count} referrals milestone`);
        } else if (milestone.type === 'BADGE') {
            // TODO: Implement badge system
            await prisma.referralReward.create({
                data: {
                    userId,
                    type: 'MILESTONE_BONUS',
                    description: `${milestone.value} badge unlocked`,
                    status: 'ISSUED',
                    issuedAt: new Date(),
                },
            });
        }
    }

    /**
     * Get referral statistics for a user
     */
    static async getReferralStats(userId: string): Promise<ReferralStats> {
        const referralCode = await prisma.referralCode.findUnique({
            where: { userId },
        });

        if (!referralCode) {
            return {
                code: '',
                clicks: 0,
                signups: 0,
                conversions: 0,
                conversionRate: 0,
                totalEarnings: 0,
                pendingRewards: 0,
            };
        }

        const conversionRate =
            referralCode.clicks > 0
                ? (referralCode.conversions / referralCode.clicks) * 100
                : 0;

        return {
            code: referralCode.code,
            clicks: referralCode.clicks,
            signups: referralCode.signups,
            conversions: referralCode.conversions,
            conversionRate: Math.round(conversionRate * 100) / 100,
            totalEarnings: referralCode.totalRewards,
            pendingRewards: referralCode.pendingRewards,
        };
    }

    /**
     * Get leaderboard of top referrers
     */
    static async getLeaderboard(limit: number = 50) {
        return await prisma.user.findMany({
            where: {
                successfulReferrals: { gt: 0 },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
                successfulReferrals: true,
                referralEarnings: true,
            },
            orderBy: { successfulReferrals: 'desc' },
            take: limit,
        });
    }

    /**
     * Get referral history for a user
     */
    static async getReferralHistory(userId: string) {
        return await prisma.referral.findMany({
            where: { referrerId: userId },
            include: {
                referee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
