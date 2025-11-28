import prisma from '../db/prisma';
import { FeatureFlagService } from './feature-flag.service';
import crypto from 'crypto';

/**
 * API Licensing Service - Developer Portal & API Monetization
 * Feature: FEATURE_API_LICENSING (disabled by default)
 */
export class APILicensingService {
    /**
     * Create API key for developer
     */
    static async createAPIKey(userId: string, config: {
        name: string;
        scopes: string[];
        tier?: string;
    }) {
        const isEnabled = await FeatureFlagService.isEnabled('FEATURE_API_LICENSING', userId);
        if (!isEnabled) {
            throw new Error('API Licensing feature not available');
        }

        // Generate secure API key
        const key = this.generateAPIKey();
        const hashedKey = this.hashAPIKey(key);
        const keyPrefix = key.substring(0, 8);

        // Get tier limits
        const limits = this.getTierLimits(config.tier || 'FREE');

        const apiKey = await prisma.aPIKey.create({
            data: {
                userId,
                name: config.name,
                key: hashedKey,
                keyPrefix,
                scopes: config.scopes,
                tier: config.tier || 'FREE',
                rateLimit: limits.rateLimit,
                dailyLimit: limits.dailyLimit,
                monthlyLimit: limits.monthlyLimit,
            },
        });

        // Update developer profile
        await this.updateDeveloperStats(userId);

        // Return unhashed key ONLY once
        return {
            ...apiKey,
            key, // Show actual key only on creation
        };
    }

    /**
     * Validate API key
     */
    static async validateAPIKey(apiKey: string): Promise<{
        valid: boolean;
        userId?: string;
        scopes?: string[];
        rateLimitRemaining?: number;
    }> {
        const hashedKey = this.hashAPIKey(apiKey);

        const key = await prisma.aPIKey.findUnique({
            where: { key: hashedKey },
        });

        if (!key || !key.isActive || key.isRevoked) {
            return { valid: false };
        }

        // Check if expired
        if (key.expiresAt && key.expiresAt < new Date()) {
            return { valid: false };
        }

        // Check rate limits
        if (key.requestsToday >= key.dailyLimit) {
            return { valid: false };
        }

        return {
            valid: true,
            userId: key.userId,
            scopes: key.scopes,
            rateLimitRemaining: key.dailyLimit - key.requestsToday,
        };
    }

    /**
     * Log API usage
     */
    static async logAPIUsage(apiKeyId: string, request: {
        endpoint: string;
        method: string;
        params?: any;
        statusCode: number;
        responseTime: number;
        ipAddress: string;
        userAgent?: string;
    }) {
        // Calculate cost
        const cost = this.calculateCost(request.endpoint);

        await prisma.aPIUsageLog.create({
            data: {
                apiKeyId,
                endpoint: request.endpoint,
                method: request.method,
                requestParams: request.params,
                statusCode: request.statusCode,
                responseTime: request.responseTime,
                ipAddress: request.ipAddress,
                userAgent: request.userAgent,
                cost,
            },
        });

        // Update key stats
        await prisma.aPIKey.update({
            where: { id: apiKeyId },
            data: {
                totalRequests: { increment: 1 },
                requestsToday: { increment: 1 },
                requestsThisMonth: { increment: 1 },
                lastUsedAt: new Date(),
            },
        });
    }

    /**
     * Get user's API keys
     */
    static async getUserAPIKeys(userId: string) {
        return await prisma.aPIKey.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                keyPrefix: true, // Only show prefix for security
                scopes: true,
                tier: true,
                rateLimit: true,
                totalRequests: true,
                lastUsedAt: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get API usage stats
     */
    static async getUsageStats(apiKeyId: string, period: 'day' | 'month' | 'all') {
        const key = await prisma.aPIKey.findUnique({
            where: { id: apiKeyId },
        });

        if (!key) {
            throw new Error('API key not found');
        }

        let startDate = new Date();
        if (period === 'day') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'month') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate = new Date(0); // All time
        }

        const logs = await prisma.aPIUsageLog.findMany({
            where: {
                apiKeyId,
                timestamp: { gte: startDate },
            },
            orderBy: { timestamp: 'desc' },
            take: 100,
        });

        // Calculate stats
        const totalRequests = logs.length;
        const avgResponseTime = logs.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests || 0;
        const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);

        const endpointBreakdown: Record<string, number> = {};
        logs.forEach((log) => {
            endpointBreakdown[log.endpoint] = (endpointBreakdown[log.endpoint] || 0) + 1;
        });

        return {
            totalRequests,
            avgResponseTime: Math.round(avgResponseTime),
            totalCost,
            endpointBreakdown,
            recentLogs: logs.slice(0, 10),
        };
    }

    /**
     * Revoke API key
     */
    static async revokeAPIKey(apiKeyId: string, reason?: string) {
        await prisma.aPIKey.update({
            where: { id: apiKeyId },
            data: {
                isActive: false,
                isRevoked: true,
                revokedAt: new Date(),
                revokedReason: reason,
            },
        });
    }

    /**
     * Get available API products
     */
    static async getAPIProducts() {
        return await prisma.aPIProduct.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    // ========== Private Helper Methods ==========

    private static generateAPIKey(): string {
        // Generate secure random key
        const buffer = crypto.randomBytes(32);
        return `sk_live_${buffer.toString('hex')}`;
    }

    private static hashAPIKey(key: string): string {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    private static getTierLimits(tier: string) {
        const limits = {
            FREE: {
                rateLimit: 100,
                dailyLimit: 1000,
                monthlyLimit: 10000,
            },
            PRO: {
                rateLimit: 1000,
                dailyLimit: 50000,
                monthlyLimit: 1000000,
            },
            ENTERPRISE: {
                rateLimit: 10000,
                dailyLimit: 1000000,
                monthlyLimit: null, // Unlimited
            },
        };

        return limits[tier as keyof typeof limits] || limits.FREE;
    }

    private static calculateCost(endpoint: string): number {
        // Pricing per request
        const pricing: Record<string, number> = {
            '/api/v1/narrative/generate': 0.01, // $0.01 per generation
            '/api/v1/sentiment/analyze': 0.005, // $0.005 per analysis
            '/api/v1/pattern/recognize': 0.02, // $0.02 per recognition
        };

        return pricing[endpoint] || 0.001; // Default $0.001
    }

    private static async updateDeveloperStats(userId: string) {
        const profile = await prisma.developerProfile.findUnique({
            where: { userId },
        });

        if (profile) {
            await prisma.developerProfile.update({
                where: { userId },
                data: {
                    totalAPIKeys: { increment: 1 },
                },
            });
        } else {
            // Create developer profile if doesn't exist
            await prisma.developerProfile.create({
                data: {
                    userId,
                    totalAPIKeys: 1,
                },
            });
        }
    }

    /**
     * Reset daily counters (run via cron)
     */
    static async resetDailyCounters() {
        await prisma.aPIKey.updateMany({
            where: { isActive: true },
            data: { requestsToday: 0 },
        });
    }

    /**
     * Reset monthly counters (run via cron)
     */
    static async resetMonthlyCounters() {
        await prisma.aPIKey.updateMany({
            where: { isActive: true },
            data: { requestsThisMonth: 0 },
        });
    }
}
