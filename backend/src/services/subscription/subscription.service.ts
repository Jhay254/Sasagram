import { PrismaClient } from '@prisma/client';
import { paymentService } from '../payment/payment.service';
import paypalService from '../payment/paypal.service';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

/**
 * Subscription management service
 */
export class SubscriptionService {
    /**
     * Create a new subscription
     */
    async createSubscription(
        subscriberId: string,
        creatorId: string,
        tierId: string,
        provider: 'paypal' | 'stripe' = 'paypal'
    ): Promise<{ subscription: any; approvalUrl?: string }> {
        try {
            // 1. Validate tier exists and is active
            const tier = await prisma.subscriptionTier.findUnique({
                where: { id: tierId },
                include: { creator: true },
            });

            if (!tier) {
                throw new Error('Subscription tier not found');
            }

            if (!tier.isActive) {
                throw new Error('Subscription tier is not active');
            }

            if (tier.creatorId !== creatorId) {
                throw new Error('Tier does not belong to this creator');
            }

            // 2. Check for existing active subscription
            const existingSubscription = await prisma.subscription.findUnique({
                where: {
                    subscriberId_creatorId: {
                        subscriberId,
                        creatorId,
                    },
                },
            });

            if (existingSubscription && existingSubscription.status === 'active') {
                throw new Error('User already has an active subscription to this creator');
            }

            // 3. Get subscriber details
            const subscriber = await prisma.user.findUnique({
                where: { id: subscriberId },
            });

            if (!subscriber) {
                throw new Error('Subscriber not found');
            }

            // 4. Create subscription via payment provider
            const paymentProvider = paymentService.getProviderInstance();

            const providerSubscription = await paymentProvider.createSubscription({
                customerId: subscriberId,
                customerEmail: subscriber.email,
                planId: tierId,
                planName: tier.name,
                planPrice: tier.price,
                returnUrl: `${process.env.FRONTEND_URL}/subscription/success`,
                cancelUrl: `${process.env.FRONTEND_URL}/subscription/cancel`,
            });

            // 5. Save to database
            const subscription = await prisma.subscription.create({
                data: {
                    subscriberId,
                    creatorId,
                    tierId,
                    status: providerSubscription.status,
                    provider,
                    providerSubId: providerSubscription.id,
                    currentPeriodStart: providerSubscription.currentPeriodStart,
                    currentPeriodEnd: providerSubscription.currentPeriodEnd,
                },
            });

            logger.info(`Subscription created: ${subscription.id} for user ${subscriberId}`);

            return {
                subscription,
                approvalUrl: providerSubscription.approvalUrl,
            };
        } catch (error: any) {
            logger.error('Error creating subscription:', error);
            throw error;
        }
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(subscriptionId: string, userId: string): Promise<void> {
        try {
            // 1. Get subscription
            const subscription = await prisma.subscription.findUnique({
                where: { id: subscriptionId },
            });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            // 2. Verify ownership
            if (subscription.subscriberId !== userId) {
                throw new Error('Unauthorized to cancel this subscription');
            }

            // 3. Cancel via payment provider
            const paymentProvider = paymentService.getProviderInstance();
            await paymentProvider.cancelSubscription(subscription.providerSubId);

            // 4. Update database - set to cancel at period end
            await prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    cancelAtPeriodEnd: true,
                    updatedAt: new Date(),
                },
            });

            logger.info(`Subscription ${subscriptionId} will cancel at period end`);
        } catch (error: any) {
            logger.error('Error canceling subscription:', error);
            throw error;
        }
    }

    /**
     * Handle webhook from payment provider
     */
    async handleWebhook(provider: string, payload: any, signature: string): Promise<void> {
        try {
            // 1. Verify webhook signature
            const paymentProvider = paymentService.getProviderInstance();
            const isValid = paymentProvider.verifyWebhook(payload, signature);

            if (!isValid) {
                throw new Error('Invalid webhook signature');
            }

            // 2. Parse event
            const event = paymentProvider.parseWebhookEvent(payload);
            logger.info(`Webhook received: ${event.type} for subscription ${event.subscriptionId}`);

            // 3. Handle event type
            switch (event.type) {
                case 'BILLING.SUBSCRIPTION.ACTIVATED':
                case 'PAYMENT.SALE.COMPLETED':
                    await this.handlePaymentSuccess(event);
                    break;

                case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
                case 'PAYMENT.SALE.DENIED':
                    await this.handlePaymentFailed(event);
                    break;

                case 'BILLING.SUBSCRIPTION.CANCELLED':
                    await this.handleSubscriptionCanceled(event);
                    break;

                case 'BILLING.SUBSCRIPTION.SUSPENDED':
                    await this.handleSubscriptionSuspended(event);
                    break;

                default:
                    logger.warn(`Unhandled webhook event type: ${event.type}`);
            }
        } catch (error: any) {
            logger.error('Error handling webhook:', error);
            throw error;
        }
    }

    /**
     * Handle successful payment
     */
    private async handlePaymentSuccess(event: any): Promise<void> {
        const subscription = await prisma.subscription.findFirst({
            where: { providerSubId: event.subscriptionId },
            include: { tier: true },
        });

        if (!subscription) {
            logger.warn(`Subscription not found for provider ID: ${event.subscriptionId}`);
            return;
        }

        // Update subscription status
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'active',
                updatedAt: new Date(),
            },
        });

        // Record payment
        if (event.amount && event.paymentId) {
            const creatorAmount = event.amount * 0.4; // 40% creator share
            const platformFee = event.amount * 0.6; // 60% platform fee

            await prisma.payment.create({
                data: {
                    subscriptionId: subscription.id,
                    amount: event.amount,
                    currency: 'USD',
                    provider: subscription.provider,
                    providerPaymentId: event.paymentId,
                    status: 'succeeded',
                    creatorAmount,
                    platformFee,
                },
            });

            logger.info(`Payment recorded: $${event.amount} for subscription ${subscription.id}`);
        }
    }

    /**
     * Handle failed payment
     */
    private async handlePaymentFailed(event: any): Promise<void> {
        const subscription = await prisma.subscription.findFirst({
            where: { providerSubId: event.subscriptionId },
        });

        if (!subscription) {
            return;
        }

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'past_due',
                updatedAt: new Date(),
            },
        });

        logger.warn(`Payment failed for subscription ${subscription.id}`);
    }

    /**
     * Handle subscription canceled
     */
    private async handleSubscriptionCanceled(event: any): Promise<void> {
        const subscription = await prisma.subscription.findFirst({
            where: { providerSubId: event.subscriptionId },
        });

        if (!subscription) {
            return;
        }

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'canceled',
                updatedAt: new Date(),
            },
        });

        logger.info(`Subscription ${subscription.id} canceled`);
    }

    /**
     * Handle subscription suspended
     */
    private async handleSubscriptionSuspended(event: any): Promise<void> {
        const subscription = await prisma.subscription.findFirst({
            where: { providerSubId: event.subscriptionId },
        });

        if (!subscription) {
            return;
        }

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'paused',
                updatedAt: new Date(),
            },
        });

        logger.info(`Subscription ${subscription.id} suspended`);
    }

    /**
     * Check if user has access to creator's content
     */
    async checkAccess(
        userId: string,
        creatorId: string,
        requiredTier: 'bronze' | 'gold'
    ): Promise<boolean> {
        try {
            // 1. Get user's subscription to creator
            const subscription = await prisma.subscription.findUnique({
                where: {
                    subscriberId_creatorId: {
                        subscriberId: userId,
                        creatorId,
                    },
                },
                include: { tier: true },
            });

            if (!subscription) {
                return false;
            }

            // 2. Check if active
            if (subscription.status !== 'active') {
                return false;
            }

            // 3. Check if tier meets requirement
            const tierHierarchy: Record<string, number> = {
                'Free': 0,
                'Bronze': 1,
                'Gold': 2,
            };

            const requiredLevel = requiredTier === 'bronze' ? 1 : 2;
            const userLevel = tierHierarchy[subscription.tier.name] || 0;

            return userLevel >= requiredLevel;
        } catch (error: any) {
            logger.error('Error checking access:', error);
            return false;
        }
    }

    /**
     * Get user's subscriptions
     */
    async getUserSubscriptions(userId: string): Promise<any[]> {
        return prisma.subscription.findMany({
            where: { subscriberId: userId },
            include: {
                tier: true,
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get creator's subscribers
     */
    async getCreatorSubscribers(creatorId: string): Promise<any[]> {
        return prisma.subscription.findMany({
            where: { creatorId },
            include: {
                tier: true,
                subscriber: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Create PayPal order for subscription
     */
    async createPayPalOrder(
        userId: string,
        creatorId: string,
        tierId: string
    ): Promise<{ orderId: string; approvalUrl: string }> {
        try {
            // Get tier details
            const tier = await prisma.subscriptionTier.findUnique({
                where: { id: tierId },
                include: { creator: true },
            });

            if (!tier) {
                throw new Error('Subscription tier not found');
            }

            if (!tier.isActive) {
                throw new Error('Subscription tier is not active');
            }

            // Create PayPal order
            const order = await paypalService.createOrder(
                tierId,
                tier.price,
                'USD',
                `${tier.name} subscription to ${tier.creator.displayName || tier.creator.name}`
            );

            // Find approval URL
            const approvalLink = order.links.find((link) => link.rel === 'approve');
            if (!approvalLink) {
                throw new Error('PayPal approval URL not found');
            }

            // Store pending subscription
            await prisma.subscription.create({
                data: {
                    subscriberId: userId,
                    creatorId,
                    tierId,
                    status: 'pending',
                    provider: 'paypal',
                    providerSubId: order.id,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                },
            });

            return {
                orderId: order.id,
                approvalUrl: approvalLink.href,
            };
        } catch (error: any) {
            logger.error('Error creating PayPal order:', error);
            throw error;
        }
    }

    /**
     * Capture PayPal payment and activate subscription
     */
    async capturePayPalPayment(
        orderId: string,
        userId: string
    ): Promise<any> {
        try {
            // Capture the payment
            const captureResult = await paypalService.captureOrder(orderId);

            if (captureResult.status !== 'COMPLETED') {
                throw new Error('Payment was not completed');
            }

            // Find the subscription
            const subscription = await prisma.subscription.findFirst({
                where: {
                    providerSubId: orderId,
                    subscriberId: userId,
                },
                include: {
                    tier: true,
                    creator: true,
                },
            });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            // Update subscription to active
            const updatedSubscription = await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                },
            });

            // Update creator's subscriber count
            await prisma.user.update({
                where: { id: subscription.creatorId },
                data: {
                    subscriberCount: { increment: 1 },
                },
            });

            // Record the payment
            const amount = parseFloat(captureResult.purchase_units[0].payments.captures[0].amount.value);
            const creatorAmount = amount * 0.4; // 40% to creator
            const platformFee = amount * 0.6; // 60% platform fee

            await prisma.payment.create({
                data: {
                    subscriptionId: subscription.id,
                    amount,
                    currency: 'USD',
                    provider: 'paypal',
                    providerPaymentId: captureResult.purchase_units[0].payments.captures[0].id,
                    status: 'succeeded',
                    creatorAmount,
                    platformFee,
                },
            });

            logger.info(`Subscription ${subscription.id} activated for user ${userId}`);

            return updatedSubscription;
        } catch (error: any) {
            logger.error('Error capturing PayPal payment:', error);
            throw error;
        }
    }
}

export const subscriptionService = new SubscriptionService();
