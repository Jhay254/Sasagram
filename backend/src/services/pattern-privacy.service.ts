import prisma from '../db/prisma';

export class PatternPrivacyService {
    /**
     * Get user's privacy settings
     */
    static async getPrivacySettings(userId: string) {
        let settings = await prisma.patternPrivacy.findUnique({
            where: { userId },
        });

        if (!settings) {
            // Create default settings (all opt-in as per requirement)
            settings = await prisma.patternPrivacy.create({
                data: { userId },
            });
        }

        return settings;
    }

    /**
     * Update privacy settings
     */
    static async updatePrivacySettings(userId: string, updates: any) {
        return await prisma.patternPrivacy.upsert({
            where: { userId },
            update: updates,
            create: {
                userId,
                ...updates,
            },
        });
    }

    /**
     * Accept prediction disclaimer
     */
    static async acceptPredictionDisclaimer(userId: string) {
        return await this.updatePrivacySettings(userId, {
            acceptedPredictionDisclaimer: true,
            disclaimerAcceptedAt: new Date(),
        });
    }

    /**
     * Check if user has enabled a specific feature
     */
    static async hasFeatureEnabled(userId: string, feature: string): Promise<boolean> {
        const settings = await this.getPrivacySettings(userId);
        return (settings as any)[feature] === true;
    }

    /**
     * Filter patterns based on user's privacy settings
     */
    static async filterPatternsByPrivacy(userId: string, patterns: any[]) {
        const settings = await this.getPrivacySettings(userId);

        return patterns.filter(pattern => {
            switch (pattern.type) {
                case 'CAREER':
                    return settings.enableCareerPatterns;
                case 'RELATIONSHIP':
                    return settings.enableRelationshipPatterns;
                case 'PRODUCTIVITY':
                    return settings.enableProductivityPatterns;
                case 'HEALTH':
                    return settings.enableHealthPatterns;
                case 'FINANCIAL':
                    return settings.enableFinancialPatterns;
                case 'SOCIAL':
                    return settings.enableSocialPatterns;
                case 'CREATIVE':
                    return settings.enableCreativePatterns;
                default:
                    return false;
            }
        });
    }
}
