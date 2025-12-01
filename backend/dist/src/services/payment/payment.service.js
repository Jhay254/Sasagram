"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const paypal_provider_1 = require("./paypal-provider");
const stripe_provider_1 = require("./stripe-provider");
const logger_1 = require("../../utils/logger");
/**
 * Payment service factory
 * Provides access to payment providers
 */
class PaymentService {
    constructor(providerType = 'paypal') {
        this.providerType = providerType;
        this.provider = this.getProvider(providerType);
        logger_1.logger.info(`PaymentService initialized with ${providerType} provider`);
    }
    /**
     * Get provider instance
     */
    getProvider(type) {
        switch (type) {
            case 'paypal':
                return paypal_provider_1.paypalProvider;
            case 'stripe':
                return stripe_provider_1.stripeProvider;
            default:
                throw new Error(`Unknown payment provider: ${type}`);
        }
    }
    /**
     * Get the current provider
     */
    getProviderInstance() {
        return this.provider;
    }
    /**
     * Get the provider type
     */
    getProviderType() {
        return this.providerType;
    }
    /**
     * Switch provider (useful for testing or multi-provider support)
     */
    switchProvider(providerType) {
        this.providerType = providerType;
        this.provider = this.getProvider(providerType);
        logger_1.logger.info(`Switched to ${providerType} provider`);
    }
}
exports.PaymentService = PaymentService;
// Default instance using PayPal (MVP)
exports.paymentService = new PaymentService('paypal');
