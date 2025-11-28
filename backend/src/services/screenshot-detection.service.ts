import prisma from '../db/prisma';

/**
 * Service for handling screenshot detection and security violations
 */
export class ScreenshotDetectionService {
    /**
     * Log screenshot attempt
     */
    static async logScreenshotAttempt(
        userId: string,
        reportId: string,
        deviceInfo: any
    ) {
        // Log the violation
        const violation = await prisma.securityViolation.create({
            data: {
                userId,
                reportId,
                violationType: 'SCREENSHOT',
                deviceId: deviceInfo.deviceId || 'unknown',
                deviceType: deviceInfo.deviceType || 'unknown',
                ipAddress: deviceInfo.ipAddress || '0.0.0.0',
                actionTaken: 'WARNING',
                warningShown: true,
            },
        });

        // Log in access log as well
        await prisma.accessLog.create({
            data: {
                userId,
                reportId,
                action: 'SCREENSHOT_ATTEMPT',
                actionResult: 'BLOCKED',
                deviceId: deviceInfo.deviceId || 'unknown',
                deviceType: deviceInfo.deviceType || 'unknown',
                ipAddress: deviceInfo.ipAddress || '0.0.0.0',
                userAgent: deviceInfo.userAgent || '',
                screenshotAttempted: true,
            },
        });

        // Update subscription violation count
        await this.incrementViolationCount(userId);

        // Check if should suspend
        const shouldSuspend = await this.checkSuspensionThreshold(userId);
        if (shouldSuspend) {
            await this.suspendAccount(userId, 'Multiple screenshot violations');
        }

        return violation;
    }

    /**
     * Log screen recording attempt
     */
    static async logScreenRecordAttempt(
        userId: string,
        reportId: string,
        deviceInfo: any
    ) {
        const violation = await prisma.securityViolation.create({
            data: {
                userId,
                reportId,
                violationType: 'SCREEN_RECORD',
                deviceId: deviceInfo.deviceId || 'unknown',
                deviceType: deviceInfo.deviceType || 'unknown',
                ipAddress: deviceInfo.ipAddress || '0.0.0.0',
                actionTaken: 'SUSPEND_ACCOUNT',
                accountLocked: true,
                lockDuration: 72, // 3 days
                unlockAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
            },
        });

        await this.suspendAccount(userId, 'Screen recording detected - serious violation', 72);

        return violation;
    }

    /**
     * Increment violation count for user
     */
    private static async incrementViolationCount(userId: string) {
        await prisma.platinumSubscription.update({
            where: { userId },
            data: {
                violationCount: { increment: 1 },
                lastViolation: new Date(),
            },
        });
    }

    /**
     * Check if user should be suspended
     */
    private static async checkSuspensionThreshold(userId: string): Promise<boolean> {
        const subscription = await prisma.platinumSubscription.findUnique({
            where: { userId },
        });

        if (!subscription) return false;

        // Suspend after 3 violations
        return subscription.violationCount >= 3;
    }

    /**
     * Suspend account
     */
    static async suspendAccount(userId: string, reason: string, hours: number = 24) {
        const suspendedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

        await prisma.platinumSubscription.update({
            where: { userId },
            data: {
                isSuspended: true,
                suspendedUntil,
            },
        });

        // TODO: Send email notification to user
        console.log(`Account ${userId} suspended until ${suspendedUntil}. Reason: ${reason}`);
    }

    /**
     * Unsuspend account (manual admin action or auto after time)
     */
    static async unsuspendAccount(userId: string) {
        await prisma.platinumSubscription.update({
            where: { userId },
            data: {
                isSuspended: false,
                suspendedUntil: null,
            },
        });
    }

    /**
     * Auto-unsuspend expired suspensions (run as cron job)
     */
    static async autoUnsuspend() {
        const now = new Date();

        const result = await prisma.platinumSubscription.updateMany({
            where: {
                isSuspended: true,
                suspendedUntil: { lte: now },
            },
            data: {
                isSuspended: false,
                suspendedUntil: null,
            },
        });

        console.log(`Auto-unsuspended ${result.count} accounts`);
        return result.count;
    }

    /**
     * Get user's violation history
     */
    static async getViolationHistory(userId: string) {
        return await prisma.securityViolation.findMany({
            where: { userId },
            orderBy: { violatedAt: 'desc' },
        });
    }

    /**
     * Check if user is currently suspended
     */
    static async isSuspended(userId: string): Promise<boolean> {
        const subscription = await prisma.platinumSubscription.findUnique({
            where: { userId },
        });

        if (!subscription) return false;

        if (subscription.isSuspended) {
            // Check if suspension has expired
            if (subscription.suspendedUntil && subscription.suspendedUntil < new Date()) {
                await this.unsuspendAccount(userId);
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Acknowledge violation (user confirms they saw warning)
     */
    static async acknowledgeViolation(violationId: string, userId: string, explanation?: string) {
        const violation = await prisma.securityViolation.findUnique({
            where: { id: violationId },
        });

        if (!violation || violation.userId !== userId) {
            throw new Error('Violation not found or unauthorized');
        }

        await prisma.securityViolation.update({
            where: { id: violationId },
            data: {
                userAcknowledged: true,
                acknowledgedAt: new Date(),
                userExplanation: explanation,
            },
        });
    }
}
