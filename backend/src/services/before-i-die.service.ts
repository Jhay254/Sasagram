import prisma from '../db/prisma';
import { FeatureFlagService } from './feature-flag.service';
import { sendEmail } from '../utils/email'; // Assume email utility exists

/**
 * Before I Die Service - Dead Man's Switch & Posthumous Content
 * Feature: FEATURE_BEFORE_I_DIE (disabled by default)
 */
export class BeforeIDieService {
    /**
     * Setup dead man's switch for user
     */
    static async setupDeadMansSwitch(userId: string, config: {
        checkInFrequency?: string;
        trusteeEmail?: string;
        trusteeName?: string;
        gracePeriodDays?: number;
    }) {
        const isEnabled = await FeatureFlagService.isEnabled('FEATURE_BEFORE_I_DIE', userId);
        if (!isEnabled) {
            throw new Error('Before I Die feature not available');
        }

        // Calculate next check-in date
        const nextCheckIn = this.calculateNextCheckIn(config.checkInFrequency || 'MONTHLY');

        const dms = await prisma.deadMansSwitch.upsert({
            where: { userId },
            create: {
                userId,
                checkInFrequency: config.checkInFrequency || 'MONTHLY',
                nextCheckInDue: nextCheckIn,
                trusteeEmail: config.trusteeEmail,
                trusteeName: config.trusteeName,
                gracePeriodDays: config.gracePeriodDays || 7,
            },
            update: {
                checkInFrequency: config.checkInFrequency,
                trusteeEmail: config.trusteeEmail,
                trusteeName: config.trusteeName,
                gracePeriodDays: config.gracePeriodDays,
            },
        });

        return dms;
    }

    /**
     * User check-in (confirms they're alive)
     */
    static async checkIn(userId: string) {
        const dms = await prisma.deadMansSwitch.findUnique({
            where: { userId },
        });

        if (!dms) {
            throw new Error('Dead mans switch not configured');
        }

        const nextCheckIn = this.calculateNextCheckIn(dms.checkInFrequency);

        await prisma.deadMansSwitch.update({
            where: { userId },
            data: {
                lastCheckIn: new Date(),
                nextCheckInDue: nextCheckIn,
                missedCheckIns: 0,
                warningsSent: 0,
            },
        });

        return { success: true, nextCheckIn };
    }

    /**
     * Check for missed check-ins (run daily via cron)
     */
    static async processMissedCheckIns() {
        const now = new Date();

        const overdue = await prisma.deadMansSwitch.findMany({
            where: {
                isActive: true,
                isTriggered: false,
                nextCheckInDue: {
                    lte: now,
                },
            },
            include: { user: true },
        });

        for (const dms of overdue) {
            await this.handleMissedCheckIn(dms);
        }
    }

    /**
     * Handle missed check-in
     */
    private static async handleMissedCheckIn(dms: any) {
        const daysMissed = Math.floor(
            (Date.now() - dms.nextCheckInDue.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Within grace period - send warnings
        if (daysMissed <= dms.gracePeriodDays) {
            await this.sendCheckInReminder(dms);

            await prisma.deadMansSwitch.update({
                where: { id: dms.id },
                data: {
                    missedCheckIns: { increment: 1 },
                    warningsSent: { increment: 1 },
                    lastWarningAt: new Date(),
                },
            });
        } else {
            // Grace period expired - trigger switch
            await this.triggerSwitch(dms.userId);
        }
    }

    /**
     * Trigger dead man's switch
     */
    static async triggerSwitch(userId: string) {
        // Mark switch as triggered
        await prisma.deadMansSwitch.update({
            where: { userId },
            data: {
                isTriggered: true,
                triggeredAt: new Date(),
            },
        });

        // Notify trustee for verification
        const dms = await prisma.deadMansSwitch.findUnique({
            where: { userId },
            include: { user: true },
        });

        if (dms?.trusteeEmail) {
            await this.requestTrusteeVerification(userId, dms.trusteeEmail, dms.trusteeName);
        }

        // Auto-generate final chapter if configured
        await this.autoGenerateFinalChapter(userId);
    }

    /**
     * Request trustee verification
     */
    private static async requestTrusteeVerification(
        userId: string,
        trusteeEmail: string,
        trusteeName?: string
    ) {
        await prisma.deathVerification.create({
            data: {
                userId,
                verifierName: trusteeName || 'Trustee',
                verifierEmail: trusteeEmail,
                verificationMethod: 'TRUSTEE',
                status: 'PENDING',
            },
        });

        // Send email to trustee
        await sendEmail({
            to: trusteeEmail,
            subject: 'Death Verification Request - Lifeline',
            body: `You have been designated as a trustee for a Lifeline account. Please verify and upload death certificate if applicable.`,
        });
    }

    /**
     * Trustee verifies death
     */
    static async verifyDeath(verificationId: string, documentUrl?: string) {
        const verification = await prisma.deathVerification.update({
            where: { id: verificationId },
            data: {
                status: 'VERIFIED',
                verifiedAt: new Date(),
                documentUrl,
            },
        });

        // Release posthumous content
        await this.releasePosthumousContent(verification.userId);

        return verification;
    }

    /**
     * Schedule posthumous content
     */
    static async schedulePosthumousContent(userId: string, content: {
        contentType: string;
        title?: string;
        content?: string;
        mediaUrl?: string;
        recipientEmails?: string[];
        recipientNames?: string[];
        releaseCondition?: string;
        daysAfterDeath?: number;
        specificDate?: Date;
    }) {
        const isEnabled = await FeatureFlagService.isEnabled('FEATURE_BEFORE_I_DIE', userId);
        if (!isEnabled) {
            throw new Error('Before I Die feature not available');
        }

        return await prisma.posthumousContent.create({
            data: {
                userId,
                contentType: content.contentType,
                title: content.title,
                content: content.content,
                mediaUrl: content.mediaUrl,
                recipientEmails: content.recipientEmails || [],
                recipientNames: content.recipientNames || [],
                releaseCondition: content.releaseCondition || 'ON_DEATH',
                daysAfterDeath: content.daysAfterDeath,
                specificDate: content.specificDate,
            },
        });
    }

    /**
     * Release posthumous content
     */
    static async releasePosthumousContent(userId: string) {
        const content = await prisma.posthumousContent.findMany({
            where: {
                userId,
                isReleased: false,
                releaseCondition: 'ON_DEATH',
            },
        });

        for (const item of content) {
            // Release content based on type
            if (item.contentType === 'POST') {
                await this.publishPosthumousPost(item);
            } else if (item.contentType === 'LETTER') {
                await this.sendPosthumousLetters(item);
            } else if (item.contentType === 'FINAL_CHAPTER') {
                await this.publishFinalChapter(userId);
            }

            // Mark as released
            await prisma.posthumousContent.update({
                where: { id: item.id },
                data: {
                    isReleased: true,
                    releasedAt: new Date(),
                },
            });
        }
    }

    /**
     * Auto-generate final chapter
     */
    static async autoGenerateFinalChapter(userId: string) {
        const finalChapter = await prisma.finalChapter.findUnique({
            where: { userId },
        });

        if (!finalChapter || !finalChapter.autoGenerate) {
            return;
        }

        // Gather user's life data
        const [posts, diary, deletedContent] = await Promise.all([
            prisma.post.findMany({ where: { userId } }),
            prisma.diaryEntry.findMany({ where: { userId } }),
            finalChapter.includeDeleted
                ? prisma.deletedContent.findMany({ where: { userId } })
                : [],
        ]);

        // Generate final chapter with AI
        const generatedContent = await this.generateFinalChapterContent(
            { posts, diary, deletedContent },
            finalChapter.tone
        );

        await prisma.finalChapter.update({
            where: { userId },
            data: {
                content: generatedContent,
                wordCount: generatedContent.split(' ').length,
                generatedBy: 'AI',
                isFinalized: true,
                finalizedAt: new Date(),
            },
        });
    }

    /**
     * Get user's posthumous content
     */
    static async getUserPosthumousContent(userId: string) {
        return await prisma.posthumousContent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ========== Private Helper Methods ==========

    private static calculateNextCheckIn(frequency: string): Date {
        const now = new Date();

        switch (frequency) {
            case 'WEEKLY':
                now.setDate(now.getDate() + 7);
                break;
            case 'MONTHLY':
                now.setMonth(now.getMonth() + 1);
                break;
            case 'QUARTERLY':
                now.setMonth(now.getMonth() + 3);
                break;
            default:
                now.setMonth(now.getMonth() + 1);
        }

        return now;
    }

    private static async sendCheckInReminder(dms: any) {
        await sendEmail({
            to: dms.user.email,
            subject: 'Lifeline Check-In Required',
            body: `Please check in to confirm you're okay. This is check-in #${dms.missedCheckIns + 1}. You have ${dms.gracePeriodDays} days before your dead man's switch is triggered.`,
        });
    }

    private static async publishPosthumousPost(content: any) {
        // Create public post
        await prisma.post.create({
            data: {
                userId: content.userId,
                title: content.title,
                content: content.content,
                visibility: 'PUBLIC',
                isPosthumous: true,
            },
        });
    }

    private static async sendPosthumousLetters(content: any) {
        for (let i = 0; i < content.recipientEmails.length; i++) {
            await sendEmail({
                to: content.recipientEmails[i],
                subject: `A Message from ${content.recipientNames[i] || 'Someone'}`,
                body: content.content || 'A final message for you.',
            });
        }
    }

    private static async publishFinalChapter(userId: string) {
        const finalChapter = await prisma.finalChapter.findUnique({
            where: { userId },
        });

        if (finalChapter?.isFinalized) {
            await prisma.finalChapter.update({
                where: { userId },
                data: {
                    isPublished: true,
                    publishedAt: new Date(),
                },
            });
        }
    }

    private static async generateFinalChapterContent(
        data: any,
        tone: string
    ): Promise<string> {
        // Production: Use GPT-4 to generate reflective final chapter
        // For now, return template
        return `# My Final Chapter\n\nA life well lived, documented through ${data.posts.length} posts, ${data.diary.length} diary entries, and countless memories.\n\nThank you for being part of my story.`;
    }
}
