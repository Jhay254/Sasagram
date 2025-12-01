"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_service_1 = require("./subscription.service");
const client_1 = require("@prisma/client");
const payment_service_1 = require("../payment/payment.service");
// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../services/payment/payment.service');
jest.mock('../utils/logger');
describe('SubscriptionService', () => {
    let subscriptionService;
    let prisma;
    let mockPaymentProvider;
    beforeEach(() => {
        subscriptionService = new subscription_service_1.SubscriptionService();
        prisma = new client_1.PrismaClient();
        // Setup mock payment provider
        mockPaymentProvider = {
            createSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            verifyWebhook: jest.fn(),
            parseWebhookEvent: jest.fn(),
        };
        payment_service_1.paymentService.getProviderInstance.mockReturnValue(mockPaymentProvider);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createSubscription', () => {
        const mockUser = { id: 'user-1', email: 'test@example.com' };
        const mockCreator = { id: 'creator-1' };
        const mockTier = {
            id: 'tier-1',
            creatorId: 'creator-1',
            price: 9.99,
            name: 'Bronze',
            isActive: true
        };
        it('should create a subscription successfully', async () => {
            // Mock Prisma responses
            prisma.subscriptionTier.findUnique.mockResolvedValue(mockTier);
            prisma.subscription.findUnique.mockResolvedValue(null); // No existing sub
            prisma.user.findUnique.mockResolvedValue(mockUser);
            // Mock Payment Provider response
            mockPaymentProvider.createSubscription.mockResolvedValue({
                id: 'sub-123',
                status: 'pending',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(),
                approvalUrl: 'https://paypal.com/approve'
            });
            // Mock Prisma create
            prisma.subscription.create.mockResolvedValue({
                id: 'db-sub-1',
                status: 'pending'
            });
            const result = await subscriptionService.createSubscription(mockUser.id, mockCreator.id, mockTier.id);
            expect(result.approvalUrl).toBe('https://paypal.com/approve');
            expect(prisma.subscription.create).toHaveBeenCalled();
        });
        it('should fail if tier does not exist', async () => {
            prisma.subscriptionTier.findUnique.mockResolvedValue(null);
            await expect(subscriptionService.createSubscription(mockUser.id, mockCreator.id, 'invalid-tier')).rejects.toThrow('Subscription tier not found');
        });
        it('should fail if user already has active subscription', async () => {
            prisma.subscriptionTier.findUnique.mockResolvedValue(mockTier);
            prisma.subscription.findUnique.mockResolvedValue({
                status: 'active'
            });
            await expect(subscriptionService.createSubscription(mockUser.id, mockCreator.id, mockTier.id)).rejects.toThrow('User already has an active subscription');
        });
    });
    describe('checkAccess', () => {
        it('should return true if user has required tier', async () => {
            prisma.subscription.findUnique.mockResolvedValue({
                status: 'active',
                tier: { name: 'Gold' }
            });
            const hasAccess = await subscriptionService.checkAccess('user-1', 'creator-1', 'bronze');
            expect(hasAccess).toBe(true);
        });
        it('should return false if subscription is not active', async () => {
            prisma.subscription.findUnique.mockResolvedValue({
                status: 'canceled',
                tier: { name: 'Gold' }
            });
            const hasAccess = await subscriptionService.checkAccess('user-1', 'creator-1', 'bronze');
            expect(hasAccess).toBe(false);
        });
        it('should return false if tier is insufficient', async () => {
            prisma.subscription.findUnique.mockResolvedValue({
                status: 'active',
                tier: { name: 'Bronze' }
            });
            const hasAccess = await subscriptionService.checkAccess('user-1', 'creator-1', 'gold');
            expect(hasAccess).toBe(false);
        });
    });
});
