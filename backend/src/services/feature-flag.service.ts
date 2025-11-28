import prisma from '../db/prisma';

/**
 * Feature Flag Service - Control "Coming Soon" features
 * Enables activation without code deployment
 */
export class FeatureFlagService {
    /**
     * Check if feature is enabled for user
     */
    static async isEnabled(featureName: string, userId?: string): Promise<boolean> {
        const flag = await prisma.featureFlag.findUnique({
            where: { name: featureName },
        });

        if (!flag || !flag.enabled) {
            return false;
        }

        // Global rollout
        if (flag.rolloutPct === 100) {
            return true;
        }

        // User-specific beta access
        if (userId && flag.enabledForUsers.includes(userId)) {
            return true;
        }

        // Gradual rollout (hash-based consistent assignment)
        if (userId && flag.rolloutPct > 0) {
            const userHash = this.hashUserId(userId);
            return userHash < flag.rolloutPct;
        }

        return false;
    }

    /**
     * Enable feature globally
     */
    static async enableGlobally(featureName: string) {
        await prisma.featureFlag.update({
            where: { name: featureName },
            data: {
                enabled: true,
                rolloutPct: 100,
            },
        });
    }

    /**
     * Enable feature for specific users (beta testing)
     */
    static async enableForUsers(featureName: string, userIds: string[]) {
        const flag = await prisma.featureFlag.findUnique({
            where: { name: featureName },
        });

        const currentUsers = flag?.enabledForUsers || [];
        const updatedUsers = [...new Set([...currentUsers, ...userIds])];

        await prisma.featureFlag.update({
            where: { name: featureName },
            data: {
                enabled: true,
                enabledForUsers: updatedUsers,
            },
        });
    }

    /**
     * Gradual rollout (0-100%)
     */
    static async setRolloutPercentage(featureName: string, percentage: number) {
        await prisma.featureFlag.update({
            where: { name: featureName },
            data: {
                enabled: true,
                rolloutPct: Math.max(0, Math.min(100, percentage)),
            },
        });
    }

    /**
     * Get all feature flags
     */
    static async getAllFlags() {
        return await prisma.featureFlag.findMany({
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Create feature flag
     */
    static async createFlag(data: {
        name: string;
        description?: string;
        enabled?: boolean;
    }) {
        return await prisma.featureFlag.create({
            data: {
                name: data.name,
                description: data.description,
                enabled: data.enabled || false,
            },
        });
    }

    // ========== Private Helpers ==========

    private static hashUserId(userId: string): number {
        // Simple hash for consistent user assignment (0-100)
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = (hash << 5) - hash + userId.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash) % 100;
    }
}
