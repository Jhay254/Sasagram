"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.SubscriptionService = void 0;
const client_1 = require("@prisma/client");
const payment_service_1 = require("../payment/payment.service");
const logger_1 = require("../../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Subscription management service
 */
class SubscriptionService {
    /**
     * Create a new subscription
     */
    async createSubscription(subscriberId, creatorId, tierId, provider = 'paypal') {
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
            const paymentProvider = payment_service_1.paymentService.getProviderInstance();
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
            logger_1.logger.info(`Subscription created: ${subscription.id} for user ${subscriberId}`);
            return {
                subscription,
                approvalUrl: providerSubscription.approvalUrl,
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating subscription:', error);
            throw error;
        }
    }
    /**
     * Cancel a subscription
     */
    async cancelSubscription(subscriptionId, userId) {
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
            const paymentProvider = payment_service_1.paymentService.getProviderInstance();
            await paymentProvider.cancelSubscription(subscription.providerSubId);
            // 4. Update database - set to cancel at period end
            await prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    cancelAtPeriodEnd: true,
                    updatedAt: new Date(),
                },
            });
            logger_1.logger.info(`Subscription ${subscriptionId} will cancel at period end`);
        }
        catch (error) {
            logger_1.logger.error('Error canceling subscription:', error);
            throw error;
        }
    }
    /**
     * Handle webhook from payment provider
     */
    async handleWebhook(provider, payload, signature) {
        try {
            // 1. Verify webhook signature
            const paymentProvider = payment_service_1.paymentService.getProviderInstance();
            const isValid = paymentProvider.verifyWebhook(payload, signature);
            if (!isValid) {
                throw new Error('Invalid webhook signature');
            }
            // 2. Parse event
            const event = paymentProvider.parseWebhookEvent(payload);
            logger_1.logger.info(`Webhook received: ${event.type} for subscription ${event.subscriptionId}`);
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
                    logger_1.logger.warn(`Unhandled webhook event type: ${event.type}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling webhook:', error);
            throw error;
        }
    }
    /**
     * Handle successful payment
     */
    async handlePaymentSuccess(event) {
        const subscription = await prisma.subscription.findFirst({
            where: { providerSubId: event.subscriptionId },
            include: { tier: true },
        });
        if (!subscription) {
            logger_1.logger.warn(`Subscription not found for provider ID: ${event.subscriptionId}`);
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
            logger_1.logger.info(`Payment recorded: $${event.amount} for subscription ${subscription.id}`);
        }
    }
    /**
     * Handle failed payment
     */
    async handlePaymentFailed(event) {
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
        logger_1.logger.warn(`Payment failed for subscription ${subscription.id}`);
    }
    /**
     * Handle subscription canceled
     */
    async handleSubscriptionCanceled(event) {
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
        logger_1.logger.info(`Subscription ${subscription.id} canceled`);
    }
    /**
     * Handle subscription suspended
     */
    async handleSubscriptionSuspended(event) {
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
        logger_1.logger.info(`Subscription ${subscription.id} suspended`);
    }
    /**
     * Check if user has access to creator's content
     */
    async checkAccess(userId, creatorId, requiredTier) {
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
            const tierHierarchy = {
                'Free': 0,
                'Bronze': 1,
                'Gold': 2,
            };
            const requiredLevel = requiredTier === 'bronze' ? 1 : 2;
            const userLevel = tierHierarchy[subscription.tier.name] || 0;
            return userLevel >= requiredLevel;
        }
        catch (error) {
            logger_1.logger.error('Error checking access:', error);
            return false;
        }
    }
    /**
     * Get user's subscriptions
     */
    async getUserSubscriptions(userId) {
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
    async getCreatorSubscribers(creatorId) {
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
}
exports.SubscriptionService = SubscriptionService;
exports.subscriptionService = new SubscriptionService();
