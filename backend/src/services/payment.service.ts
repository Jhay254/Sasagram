import prisma from '../db/prisma';

interface PaymentData {
    subscriptionId: string;
    amount: number;
}

const PLATFORM_FEE_PERCENTAGE = 0.20; // 20%
const CREATOR_SHARE_PERCENTAGE = 0.80; // 80%

export class PaymentService {
    // Calculate revenue split
    static calculateRevenueSplit(amount: number): {
        platformFee: number;
        creatorEarnings: number;
    } {
        const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
        const creatorEarnings = amount * CREATOR_SHARE_PERCENTAGE;

        return {
            platformFee: parseFloat(platformFee.toFixed(2)),
            creatorEarnings: parseFloat(creatorEarnings.toFixed(2)),
        };
    }

    // Create payment intent (Stripe placeholder)
    static async createPaymentIntent(
        amount: number,
        currency: string = 'USD'
    ): Promise<{
        paymentIntentId: string;
        clientSecret: string;
    }> {
        // TODO: Integrate with actual Stripe API
        // const paymentIntent = await stripe.paymentIntents.create({
        //   amount: Math.round(amount * 100), // Convert to cents
        //   currency: currency.toLowerCase(),
        //   automatic_payment_methods: { enabled: true },
        // });

        // Placeholder response
        const mockPaymentIntentId = `pi_mock_${Date.now()}`;
        const mockClientSecret = `${mockPaymentIntentId}_secret_${Math.random().toString(36).substring(7)}`;

        return {
            paymentIntentId: mockPaymentIntentId,
            clientSecret: mockClientSecret,
        };
    }

    // Confirm payment (Stripe placeholder)
    static async confirmPayment(paymentIntentId: string): Promise<boolean> {
        // TODO: Integrate with actual Stripe API
        // const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
        // return paymentIntent.status === 'succeeded';

        // Placeholder - always succeeds
        return true;
    }

    // Create transaction record
    static async createTransaction(data: PaymentData): Promise<string> {
        const { subscriptionId, amount } = data;

        // Get subscription to find creator
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        // Calculate revenue split
        const { platformFee, creatorEarnings } = this.calculateRevenueSplit(amount);

        // Create transaction
        const transaction = await prisma.transaction.create({
            data: {
                subscriptionId,
                amount,
                platformFee,
                creatorEarnings,
                currency: 'USD',
                status: 'COMPLETED',
                description: `Subscription payment - ${subscription.tier}`,
            },
        });

        // Update creator earnings
        await this.updateCreatorEarnings(subscription.creatorId, creatorEarnings);

        return transaction.id;
    }

    // Update creator earnings
    static async updateCreatorEarnings(
        creatorId: string,
        amount: number
    ): Promise<void> {
        await prisma.creatorEarnings.upsert({
            where: { creatorId },
            create: {
                creatorId,
                totalEarnings: amount,
                pendingPayout: amount,
                paidOut: 0,
            },
            update: {
                totalEarnings: {
                    increment: amount,
                },
                pendingPayout: {
                    increment: amount,
                },
            },
        });
    }

    // Process refund
    static async processRefund(
        transactionId: string,
        amount: number,
        reason?: string
    ): Promise<void> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { subscription: true },
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // TODO: Integrate with actual Stripe API
        // await stripe.refunds.create({
        //   payment_intent: transaction.stripePaymentIntentId,
        //   amount: Math.round(amount * 100),
        // });

        // Update transaction
        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: 'REFUNDED',
                refundReason: reason,
                refundedAt: new Date(),
            },
        });

        // Reverse creator earnings
        const { creatorEarnings } = this.calculateRevenueSplit(amount);
        await prisma.creatorEarnings.update({
            where: { creatorId: transaction.subscription.creatorId },
            data: {
                totalEarnings: {
                    decrement: creatorEarnings,
                },
                pendingPayout: {
                    decrement: creatorEarnings,
                },
            },
        });
    }

    // Create Stripe customer (placeholder)
    static async createStripeCustomer(
        userId: string,
        email: string
    ): Promise<string> {
        // TODO: Integrate with actual Stripe API
        // const customer = await stripe.customers.create({
        //   email,
        //   metadata: { userId },
        // });

        // Placeholder customer ID
        return `cus_mock_${userId.substring(0, 8)}`;
    }

    // Attach payment method (placeholder)
    static async attachPaymentMethod(
        customerId: string,
        paymentMethodId: string
    ): Promise<void> {
        // TODO: Integrate with actual Stripe API
        // await stripe.paymentMethods.attach(paymentMethodId, {
        //   customer: customerId,
        // });

        // Placeholder - success
        console.log(`Attached payment method ${paymentMethodId} to ${customerId}`);
    }

    // Get transaction history
    static async getTransactionHistory(userId: string, isCreator: boolean = false) {
        if (isCreator) {
            // Get creator's earnings transactions
            return await prisma.transaction.findMany({
                where: {
                    subscription: {
                        creatorId: userId,
                    },
                },
                include: {
                    subscription: {
                        include: {
                            subscriber: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 50,
            });
        } else {
            // Get user's payment transactions
            return await prisma.transaction.findMany({
                where: {
                    subscription: {
                        subscriberId: userId,
                    },
                },
                include: {
                    subscription: {
                        include: {
                            creator: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    displayName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 50,
            });
        }
    }

    // Get creator earnings summary
    static async getCreatorEarnings(creatorId: string) {
        const earnings = await prisma.creatorEarnings.findUnique({
            where: { creatorId },
        });

        if (!earnings) {
            // Initialize if doesn't exist
            return await prisma.creatorEarnings.create({
                data: {
                    creatorId,
                    totalEarnings: 0,
                    pendingPayout: 0,
                    paidOut: 0,
                },
            });
        }

        return earnings;
    }

    // Request payout (placeholder)
    static async requestPayout(
        creatorId: string,
        amount: number
    ): Promise<string> {
        const earnings = await this.getCreatorEarnings(creatorId);

        if (earnings.pendingPayout < amount) {
            throw new Error('Insufficient funds for payout');
        }

        if (amount < 100) {
            throw new Error('Minimum payout amount is $100');
        }

        // TODO: Integrate with actual Stripe Connect payouts
        // const payout = await stripe.payouts.create({
        //   amount: Math.round(amount * 100),
        //   currency: 'usd',
        // }, {
        //   stripeAccount: earnings.stripeAccountId,
        // });

        // Update earnings
        await prisma.creatorEarnings.update({
            where: { creatorId },
            data: {
                pendingPayout: {
                    decrement: amount,
                },
                paidOut: {
                    increment: amount,
                },
                lastPayoutDate: new Date(),
                lastPayoutAmount: amount,
            },
        });

        return `payout_mock_${Date.now()}`;
    }
}
