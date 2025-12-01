"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revenueService = exports.RevenueService = void 0;
const client_1 = require("@prisma/client");
const payment_service_1 = require("../payment/payment.service");
const logger_1 = require("../../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Revenue management service
 */
class RevenueService {
    /**
     * Get creator metrics
     */
    async getCreatorMetrics(creatorId) {
        try {
            // 1. Get active subscribers
            const activeSubscriptions = await prisma.subscription.findMany({
                where: {
                    creatorId,
                    status: 'active',
                },
                include: { tier: true },
            });
            const totalSubscribers = activeSubscriptions.length;
            const byTier = {};
            let mrr = 0;
            activeSubscriptions.forEach((sub) => {
                byTier[sub.tier.name] = (byTier[sub.tier.name] || 0) + 1;
                mrr += sub.tier.price;
            });
            // 2. Calculate churn rate (canceled in last 30 days / active 30 days ago)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const canceledLast30Days = await prisma.subscription.count({
                where: {
                    creatorId,
                    status: 'canceled',
                    updatedAt: { gte: thirtyDaysAgo },
                },
            });
            const active30DaysAgo = await prisma.subscription.count({
                where: {
                    creatorId,
                    createdAt: { lte: thirtyDaysAgo },
                    OR: [
                        { status: 'active' },
                        { status: 'canceled', updatedAt: { gt: thirtyDaysAgo } },
                    ],
                },
            });
            const churnRate = active30DaysAgo > 0
                ? (canceledLast30Days / active30DaysAgo) * 100
                : 0;
            // 3. Calculate growth (vs previous month)
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            const revenueLastMonth = await prisma.payment.aggregate({
                where: {
                    subscription: { creatorId },
                    status: 'succeeded',
                    createdAt: { gte: thirtyDaysAgo },
                },
                _sum: { creatorAmount: true },
            });
            const revenuePriorMonth = await prisma.payment.aggregate({
                where: {
                    subscription: { creatorId },
                    status: 'succeeded',
                    createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
                },
                _sum: { creatorAmount: true },
            });
            const currentRev = revenueLastMonth._sum.creatorAmount || 0;
            const priorRev = revenuePriorMonth._sum.creatorAmount || 0;
            const revenueGrowth = priorRev > 0
                ? ((currentRev - priorRev) / priorRev) * 100
                : currentRev > 0 ? 100 : 0;
            // Subscriber growth logic similar to revenue...
            const subsLastMonth = await prisma.subscription.count({
                where: { creatorId, createdAt: { gte: thirtyDaysAgo } },
            });
            const subsPriorMonth = await prisma.subscription.count({
                where: { creatorId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
            });
            const subscriberGrowth = subsPriorMonth > 0
                ? ((subsLastMonth - subsPriorMonth) / subsPriorMonth) * 100
                : subsLastMonth > 0 ? 100 : 0;
            return {
                activeSubscribers: {
                    total: totalSubscribers,
                    byTier,
                },
                mrr,
                churnRate,
                growth: {
                    subscribers: subscriberGrowth,
                    revenue: revenueGrowth,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Error calculating creator metrics:', error);
            throw error;
        }
    }
    /**
     * Get earnings history (last 12 months)
     */
    async getEarningsHistory(creatorId, months = 12) {
        try {
            const result = [];
            const now = new Date();
            for (let i = 0; i < months; i++) {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                const payments = await prisma.payment.aggregate({
                    where: {
                        subscription: { creatorId },
                        status: 'succeeded',
                        createdAt: { gte: startOfMonth, lte: endOfMonth },
                    },
                    _sum: { creatorAmount: true },
                });
                const newSubs = await prisma.subscription.count({
                    where: {
                        creatorId,
                        createdAt: { gte: startOfMonth, lte: endOfMonth },
                    },
                });
                const payout = await prisma.payout.findFirst({
                    where: {
                        creatorId,
                        createdAt: { gte: startOfMonth, lte: endOfMonth },
                    },
                });
                result.push({
                    month: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`,
                    revenue: payments._sum.creatorAmount || 0,
                    subscribers: newSubs,
                    payoutStatus: payout ? payout.status : 'none',
                });
            }
            return result.reverse();
        }
        catch (error) {
            logger_1.logger.error('Error getting earnings history:', error);
            throw error;
        }
    }
    /**
     * Get pending payout amount
     */
    async getPendingPayout(creatorId) {
        try {
            const pendingPayments = await prisma.payment.aggregate({
                where: {
                    subscription: { creatorId },
                    status: 'succeeded',
                    payoutId: null, // Not yet paid out
                },
                _sum: { creatorAmount: true },
            });
            return pendingPayments._sum.creatorAmount || 0;
        }
        catch (error) {
            logger_1.logger.error('Error getting pending payout:', error);
            throw error;
        }
    }
    /**
     * Request a payout
     */
    async requestPayout(creatorId) {
        try {
            // 1. Check minimum threshold
            const pendingAmount = await this.getPendingPayout(creatorId);
            const THRESHOLD = 50; // $50 minimum
            if (pendingAmount < THRESHOLD) {
                throw new Error(`Minimum payout threshold is $${THRESHOLD}. Current pending: $${pendingAmount}`);
            }
            // 2. Get creator details for payout
            const creator = await prisma.user.findUnique({
                where: { id: creatorId },
            });
            if (!creator || !creator.email) {
                throw new Error('Creator email required for payout');
            }
            // 3. Create payout record
            const payout = await prisma.payout.create({
                data: {
                    creatorId,
                    amount: pendingAmount,
                    currency: 'USD',
                    status: 'processing',
                    provider: 'paypal', // Default to PayPal for MVP
                },
            });
            // 4. Link payments to this payout
            // Find all eligible payments first
            const eligiblePayments = await prisma.payment.findMany({
                where: {
                    subscription: { creatorId },
                    status: 'succeeded',
                    payoutId: null,
                },
                select: { id: true },
            });
            const paymentIds = eligiblePayments.map(p => p.id);
            // Update them
            await prisma.payment.updateMany({
                where: { id: { in: paymentIds } },
                data: { payoutId: payout.id },
            });
            // 5. Initiate transfer via payment provider
            const paymentProvider = payment_service_1.paymentService.getProviderInstance();
            const providerPayout = await paymentProvider.createPayout({
                creatorId,
                amount: pendingAmount,
                currency: 'USD',
                recipientEmail: creator.email, // Use creator's email for PayPal
            });
            // 6. Update payout with provider ID
            const updatedPayout = await prisma.payout.update({
                where: { id: payout.id },
                data: {
                    providerPayoutId: providerPayout.id,
                    status: providerPayout.status,
                },
            });
            logger_1.logger.info(`Payout ${payout.id} initiated for creator ${creatorId}: $${pendingAmount}`);
            return updatedPayout;
        }
        catch (error) {
            logger_1.logger.error('Error requesting payout:', error);
            throw error;
        }
    }
}
exports.RevenueService = RevenueService;
exports.revenueService = new RevenueService();
