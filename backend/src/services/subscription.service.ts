import prisma from '../db/prisma';
import { SubscriptionTier } from '@prisma/client';

interface SubscriptionData {
    userId: string;
    creatorId: string;
    tier: SubscriptionTier;
    price: number;
}

export class SubscriptionService {
    // Create a new subscription
    static async createSubscription(data: SubscriptionData): Promise<string> {
        const { userId, creatorId, tier, price } = data;

        // Calculate subscription period (30 days)
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        // Create subscription
        const subscription = await prisma.subscription.create({
            data: {
                subscriberId: userId,
                creatorId,
                tier,
                priceAtPurchase: price,
                status: 'ACTIVE',
                currentPeriodStart,
                currentPeriodEnd,
            },
        });

        // Update tier subscriber count
        await prisma.subscriptionTier.updateMany({
            where: {
                creatorId,
                tier,
            },
            data: {
                subscriberCount: {
                    increment: 1,
                },
            },
        });

        return subscription.id;
    }

    // Check if user has active subscription to creator
    static async checkSubscriptionStatus(
        userId: string,
        creatorId: string
    ): Promise<{
        isSubscribed: boolean;
        tier?: SubscriptionTier;
        expiresAt?: Date;
    }> {
        const subscription = await prisma.subscription.findUnique({
            where: {
                subscriberId_creatorId: {
                    subscriberId: userId,
                    creatorId,
                },
            },
        });

        if (!subscription || subscription.status !== 'ACTIVE') {
            return { isSubscribed: false };
        }

        // Check if subscription is still valid
        const now = new Date();
        if (now > subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd) {
            // Subscription expired
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: 'EXPIRED' },
            });

            return { isSubscribed: false };
        }

        return {
            isSubscribed: true,
            tier: subscription.tier,
            expiresAt: subscription.currentPeriodEnd,
        };
    }

    // Upgrade subscription to higher tier
    static async upgradeSubscription(
        subscriptionId: string,
        newTier: SubscriptionTier,
        newPrice: number
    ): Promise<void> {
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        const oldTier = subscription.tier;

        // Update subscription
        await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                tier: newTier,
                priceAtPurchase: newPrice,
            },
        });

        // Update tier counters
        await prisma.subscriptionTier.updateMany({
            where: {
                creatorId: subscription.creatorId,
                tier: oldTier,
            },
            data: {
                subscriberCount: {
                    decrement: 1,
                },
            },
        });

        await prisma.subscriptionTier.updateMany({
            where: {
                creatorId: subscription.creatorId,
                tier: newTier,
            },
            data: {
                subscriberCount: {
                    increment: 1,
                },
            },
        });
    }

    // Cancel subscription
    static async cancelSubscription(
        subscriptionId: string,
        immediate: boolean = false
    ): Promise<void> {
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        if (immediate) {
            // Cancel immediately
            await prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: 'CANCELLED',
                    canceledAt: new Date(),
                },
            });

            // Update subscriber count
            await prisma.subscriptionTier.updateMany({
                where: {
                    creatorId: subscription.creatorId,
                    tier: subscription.tier,
                },
                data: {
                    subscriberCount: {
                        decrement: 1,
                    },
                },
            });
        } else {
            // Cancel at period end
            await prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    cancelAtPeriodEnd: true,
                    canceledAt: new Date(),
                },
            });
        }
    }

    // Get tier permissions/features
    static getTierPermissions(tier: SubscriptionTier): string[] {
        const permissions: Record<SubscriptionTier, string[]> = {
            BRONZE: ['Basic access', 'First 3 chapters', 'Limited timeline'],
            SILVER: ['Full biography access', 'Complete timeline', 'All chapters'],
            GOLD: [
                'All Silver features',
                'Early access to new chapters',
                'Creator updates',
                'No ads',
            ],
            PLATINUM: [
                'All Gold features',
                'Private messaging with creator',
                'Exclusive content',
                'Behind-the-scenes',
            ],
        };

        return permissions[tier] || [];
    }

    // Get subscriber count for creator
    static async getSubscriberCount(creatorId: string): Promise<number> {
        const count = await prisma.subscription.count({
            where: {
                creatorId,
                status: 'ACTIVE',
            },
        });

        return count;
    }

    // Get all subscriptions for a user
    static async getUserSubscriptions(userId: string) {
        return await prisma.subscription.findMany({
            where: {
                subscriberId: userId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    // Get creator's tier configuration
    static async getCreatorTiers(creatorId: string) {
        return await prisma.subscriptionTier.findMany({
            where: {
                creatorId,
                isActive: true,
            },
            orderBy: {
                price: 'asc',
            },
        });
    }

    // Set tier pricing for creator
    static async setTierPricing(
        creatorId: string,
        tier: SubscriptionTier,
        price: number,
        features: string[]
    ): Promise<void> {
        await prisma.subscriptionTier.upsert({
            where: {
                creatorId_tier: {
                    creatorId,
                    tier,
                },
            },
            create: {
                creatorId,
                tier,
                price,
                features: JSON.stringify(features),
                isActive: true,
            },
            update: {
                price,
                features: JSON.stringify(features),
            },
        });
    }

    // Calculate tier comparison (for upgrades)
    static compareTiers(tier1: SubscriptionTier, tier2: SubscriptionTier): number {
        const tierOrder: Record<SubscriptionTier, number> = {
            BRONZE: 1,
            SILVER: 2,
            GOLD: 3,
            PLATINUM: 4,
        };

        return tierOrder[tier1] - tierOrder[tier2];
    }
}
