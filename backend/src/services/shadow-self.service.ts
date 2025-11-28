import prisma from '../db/prisma';
import { AIService } from './ai.service';
import { DeletedContentService } from './deleted-content.service';
import { v4 as uuidv4 } from 'uuid';

const MENTAL_HEALTH_WARNING = `
⚠️ PSYCHOLOGICAL CONTENT WARNING ⚠️

This Shadow Self Report may contain sensitive content that you deliberately chose to delete or hide. This material might include:
• Painful memories or traumatic events
• Embarrassing or shameful experiences
• Failed relationships or career setbacks
• Mental health struggles
• Content you deleted for your emotional wellbeing

BEFORE PROCEEDING:
✓ Ensure you're in a safe, private space
✓ Consider whether you're emotionally prepared
✓ Have support resources available if needed
✓ Remember: Deletion was a valid choice for self-protection

Crisis Resources:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• SAMHSA Helpline: 1-800-662-4357

This report is for self-reflection and growth. You are not obligated to view or integrate this content.
`.trim();

export class ShadowSelfService {
    /**
     * Generate Shadow Self report for user
     */
    static async generateReport(userId: string, reportPeriod: string = 'All Time') {
        // Verify Platinum subscription and NDA
        await this.verifyAccess(userId);

        // Collect deleted content
        const deletedContent = await DeletedContentService.getUserDeletedContent(userId);

        if (deletedContent.length === 0) {
            throw new Error('No deleted content found. You need deleted content to generate a Shadow Self report.');
        }

        // Analyze deletion patterns
        const patterns = await DeletedContentService.analyzeDeletionPatterns(userId);

        // Compare public vs private
        const publicPrivateComparison = await DeletedContentService.comparePublicPrivate(userId);

        // Get edited content (content that was modified)
        const editedCount = 0; // TODO: Implement content diff tracking

        // Generate AI psychological insights
        const insights = await this.generatePsychologicalInsights(deletedContent, patterns);

        // Create watermark
        const watermarkId = this.generateWatermarkId();

        // Calculate expiration (30 days)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Create report
        const report = await prisma.shadowSelfReport.create({
            data: {
                userId,
                reportPeriod,
                reportVersion: '1.0',
                deletedItemCount: deletedContent.length,
                hiddenItemCount: publicPrivateComparison.privateCount,
                editedItemCount: editedCount,
                censoredThemes: patterns.themeBreakdown.map(t => t.theme),
                emotionalPatterns: patterns.emotionalBreakdown.map(e => e.emotion),
                publicPrivateGap: publicPrivateComparison.publicPrivateGap,
                psychologicalInsights: insights.insights,
                integrationSuggestions: insights.suggestions,
                healingOpportunities: insights.healing,
                reportData: {
                    mentalHealthWarning: MENTAL_HEALTH_WARNING,
                    deletedContent: deletedContent.map(item => ({
                        id: item.id,
                        type: item.contentType,
                        summary: item.contentSummary,
                        deletedAt: item.deletedAt,
                        reason: item.deletionReason,
                        theme: item.detectedTheme,
                        emotion: item.emotionalTone,
                    })),
                    patterns,
                    publicPrivateComparison,
                },
                watermarkId,
                expiresAt,
            },
        });

        // Update subscription usage
        await this.updateSubscriptionUsage(userId);

        // Create forensic watermark
        await this.createForensicWatermark(report.id, userId, watermarkId);

        return report;
    }

    /**
     * Generate psychological insights using AI
     */
    private static async generatePsychologicalInsights(deletedContent: any[], patterns: any) {
        const contentSummaries = deletedContent.slice(0, 20).map(item =>
            `- ${item.detectedTheme || 'general'}: ${item.contentSummary}`
        ).join('\n');

        const prompt = `You are a compassionate psychologist analyzing a person's "Shadow Self" - the parts of their life story they've deleted or hidden.

Deleted/Hidden Content (${deletedContent.length} items):
${contentSummaries}

Deletion Patterns:
${patterns.themeBreakdown.map((t: any) => `- ${t.theme}: ${t.count} items (${Math.round(t.percentage)}%)`).join('\n')}

Emotional Patterns:
${patterns.emotionalBreakdown.map((e: any) => `- ${e.emotion}: ${e.count} items`).join('\n')}

Generate:
1. PSYCHOLOGICAL INSIGHTS (3-4 paragraphs): What does this deletion pattern reveal about their inner world? What are they protecting themselves or others from? What themes of shame, regret, or fear emerge?

2. INTEGRATION SUGGESTIONS (2-3 paragraphs): How can they compassionately integrate their shadow self? What healing work might be beneficial?

3. HEALING OPPORTUNITIES (2-3 paragraphs): What specific steps could support their growth and self-acceptance?

Be compassionate, insightful, non-judgmental, and trauma-informed. Acknowledge that deletion was a valid self-protection strategy.`;

        try {
            const response = await AIService.generateText(prompt);

            // Parse response (simple split by section headers)
            const sections = response.split(/INTEGRATION SUGGESTIONS|HEALING OPPORTUNITIES/i);

            return {
                insights: sections[0]?.trim() || response,
                suggestions: sections[1]?.trim() || 'Consider working with a therapist to explore these patterns in a safe, supportive environment.',
                healing: sections[2]?.trim() || 'Self-compassion and patience are key to integrating your shadow self.',
            };
        } catch (error) {
            console.error('Error generating AI insights:', error);

            return {
                insights: `Your deletion patterns suggest selective curation of your public narrative. The ${patterns.mostDeletedTheme || 'content'} you've removed may represent areas of vulnerability or growth.`,
                suggestions: 'Consider reflecting on what these deletions reveal about your values and boundaries.',
                healing: 'Integration of shadow aspects can lead to greater self-acceptance and wholeness.',
            };
        }
    }

    /**
     * Verify user has access to Shadow Self features
     */
    private static async verifyAccess(userId: string) {
        const subscription = await prisma.platinumSubscription.findUnique({
            where: { userId },
        });

        if (!subscription || subscription.status !== 'ACTIVE') {
            throw new Error('Platinum subscription required for Shadow Self reports');
        }

        if (!subscription.ndaIsValid) {
            throw new Error('You must sign the NDA before accessing Shadow Self reports');
        }

        if (subscription.isSuspended) {
            throw new Error(`Account suspended due to security violations. Suspended until ${subscription.suspendedUntil}`);
        }

        // Check monthly limit
        if (subscription.reportsThisMonth >= subscription.maxReportsPerMonth) {
            throw new Error(`Monthly report limit reached (${subscription.maxReportsPerMonth}). Limit resets on ${subscription.nextBillingDate}`);
        }

        return subscription;
    }

    /**
     * Update subscription usage statistics
     */
    private static async updateSubscriptionUsage(userId: string) {
        await prisma.platinumSubscription.update({
            where: { userId },
            data: {
                reportsGenerated: { increment: 1 },
                reportsThisMonth: { increment: 1 },
                lastReportAt: new Date(),
            },
        });
    }

    /**
     * Generate unique watermark ID
     */
    private static generateWatermarkId(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const segments = [];

        for (let i = 0; i < 4; i++) {
            let segment = '';
            for (let j = 0; j < 4; j++) {
                segment += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            segments.push(segment);
        }

        return `WM-${segments.join('-')}`;
    }

    /**
     * Create forensic watermark
     */
    private static async createForensicWatermark(reportId: string, userId: string, watermarkCode: string) {
        const shortCode = watermarkCode.substring(3); // Remove "WM-" prefix

        await prisma.forensicWatermark.create({
            data: {
                reportId,
                userId,
                watermarkCode,
                shortCode,
                sessionId: uuidv4(),
                deviceId: 'web', // TODO: Get actual device ID
                ipAddress: '0.0.0.0', // TODO: Get actual IP
                wmType: 'TEXT_INVISIBLE',
                wmData: JSON.stringify({
                    userId,
                    reportId,
                    timestamp: new Date().toISOString(),
                    code: watermarkCode,
                }),
            },
        });
    }

    /**
     * Get user's Shadow Self reports
     */
    static async getUserReports(userId: string) {
        await this.verifyAccess(userId);

        return await prisma.shadowSelfReport.findMany({
            where: {
                userId,
                isExpired: false,
            },
            orderBy: { generatedAt: 'desc' },
        });
    }

    /**
     * Get specific report with access logging
     */
    static async getReport(reportId: string, userId: string, deviceInfo: any) {
        const report = await prisma.shadowSelfReport.findUnique({
            where: { id: reportId },
        });

        if (!report || report.userId !== userId) {
            throw new Error('Report not found or unauthorized');
        }

        if (report.isExpired) {
            throw new Error('This report has expired and been deleted for security');
        }

        // Log access
        await this.logAccess(userId, reportId, 'VIEW', deviceInfo);

        // Update access count
        await prisma.shadowSelfReport.update({
            where: { id: reportId },
            data: {
                accessCount: { increment: 1 },
                lastAccessedAt: new Date(),
            },
        });

        return report;
    }

    /**
     * Log report access for security
     */
    private static async logAccess(userId: string, reportId: string, action: string, deviceInfo: any) {
        await prisma.accessLog.create({
            data: {
                userId,
                reportId,
                action,
                deviceId: deviceInfo.deviceId || 'unknown',
                deviceType: deviceInfo.deviceType || 'web',
                deviceModel: deviceInfo.deviceModel,
                ipAddress: deviceInfo.ipAddress || '0.0.0.0',
                userAgent: deviceInfo.userAgent || '',
                biometricUsed: deviceInfo.biometricUsed || false,
            },
        });
    }

    /**
     * Delete report (user-initiated)
     */
    static async deleteReport(reportId: string, userId: string) {
        const report = await prisma.shadowSelfReport.findUnique({
            where: { id: reportId },
        });

        if (!report || report.userId !== userId) {
            throw new Error('Report not found or unauthorized');
        }

        await prisma.shadowSelfReport.delete({
            where: { id: reportId },
        });
    }

    /**
     * Auto-expire old reports (run as cron job)
     */
    static async expireOldReports() {
        const now = new Date();

        const result = await prisma.shadowSelfReport.updateMany({
            where: {
                expiresAt: { lte: now },
                isExpired: false,
            },
            data: {
                isExpired: true,
            },
        });

        // Delete expired reports
        await prisma.shadowSelfReport.deleteMany({
            where: {
                isExpired: true,
            },
        });

        console.log(`Expired and deleted ${result.count} old Shadow Self reports`);
        return result.count;
    }
}
