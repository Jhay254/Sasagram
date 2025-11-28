import prisma from '../db/prisma';

/**
 * Screenshot Detection Service (Warning Mode)
 * Features: Platform-specific detection, warning notifications, violation tracking
 */
export class ScreenshotDetectionService {
    /**
     * Log screenshot attempt (warning mode - no auto-suspend)
     */
    static async logScreenshotViolation(data: {
        userId: string;
        deviceId: string;
        deviceModel?: string;
        osVersion?: string;
        appVersion?: string;
        contentType: string;
        contentId?: string;
        violationType: 'SCREENSHOT' | 'SCREEN_RECORDING' | 'UNKNOWN';
    }) {
        // Create violation record
        const violation = await prisma.screenshotViolation.create({
            data: {
                ...data,
                warningIssued: true,
                accountSuspended: false, // Warning mode: no suspension
            },
        });

        // Get user's violation count
        const violationCount = await prisma.screenshotViolation.count({
            where: { userId: data.userId },
        });

        // Send warning notification
        await this.sendWarningNotification(data.userId, violationCount);

        return {
            violation,
            violationCount,
            warningIssued: true,
            suspended: false,
        };
    }

    /**
     * Get user's violation history
     */
    static async getUserViolations(userId: string) {
        return await prisma.screenshotViolation.findMany({
            where: { userId },
            orderBy: { detectedAt: 'desc' },
        });
    }

    /**
     * Get violation statistics
     */
    static async getViolationStats(userId: string) {
        const violations = await prisma.screenshotViolation.findMany({
            where: { userId },
        });

        const byType = violations.reduce((acc, v) => {
            acc[v.violationType] = (acc[v.violationType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: violations.length,
            byType,
            lastViolation: violations[0]?.detectedAt,
        };
    }

    /**
     * Check if user has active suspension (for future use)
     */
    static async checkSuspensionStatus(userId: string) {
        const activeSuspension = await prisma.screenshotViolation.findFirst({
            where: {
                userId,
                accountSuspended: true,
            },
            orderBy: { detectedAt: 'desc' },
        });

        if (!activeSuspension) {
            return { suspended: false };
        }

        // Check if suspension has expired
        const suspensionEnd = new Date(
            activeSuspension.detectedAt.getTime() + (activeSuspension.suspensionDuration || 0) * 60 * 1000
        );

        if (suspensionEnd < new Date()) {
            return { suspended: false, expired: true };
        }

        return {
            suspended: true,
            until: suspensionEnd,
            reason: 'Screenshot violation',
        };
    }

    // ========== Private Helper Methods ==========

    /**
     * Send warning notification to user
     */
    private static async sendWarningNotification(userId: string, violationCount: number) {
        // TODO: Implement push notification
        console.log(`Sending screenshot warning to user ${userId} (violation #${violationCount})`);

        const message =
            violationCount === 1
                ? 'Screenshot detected. Please note that screenshots of protected content are tracked.'
                : `Screenshot detected (${violationCount} total). Continued violations may result in account restrictions.`;

        // Send in-app notification
        // await NotificationService.send(userId, {
        //   type: 'SCREENSHOT_WARNING',
        //   title: 'Screenshot Detected',
        //   body: message,
        // });
    }
}
