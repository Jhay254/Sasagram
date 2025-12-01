"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeProvider = exports.StripeProvider = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Stripe payment provider implementation (PLACEHOLDER)
 * Will be activated when Stripe credentials are available
 */
class StripeProvider {
    constructor() {
        this.apiKey = process.env.STRIPE_SECRET_KEY || 'placeholder';
        if (this.apiKey === 'placeholder') {
            logger_1.logger.warn('Stripe credentials not configured - provider is in placeholder mode');
        }
    }
    async createSubscription(data) {
        throw new Error('Stripe credentials not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
    async cancelSubscription(subscriptionId) {
        throw new Error('Stripe credentials not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
    async updateSubscription(subscriptionId, data) {
        throw new Error('Stripe credentials not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
    async getSubscription(subscriptionId) {
        throw new Error('Stripe credentials not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
    verifyWebhook(payload, signature) {
        throw new Error('Stripe credentials not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
    parseWebhookEvent(payload) {
        throw new Error('Stripe credentials not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
    async createPayout(data) {
        throw new Error('Stripe credentials not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
    async getPayoutStatus(payoutId) {
        throw new Error('Stripe credentials not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
}
exports.StripeProvider = StripeProvider;
exports.stripeProvider = new StripeProvider();
