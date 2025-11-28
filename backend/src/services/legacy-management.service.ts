import prisma from '../db/prisma';

/**
 * Legacy Management Service - Simplified MVP for Digital Wills
 * Features: Posthumous content, digital will, beneficiary management
 */
export class LegacyManagementService {
    /**
     * Create digital will for celebrity
     */
    static async createLegacyPlan(celebrityId: string, data: {
        executorUserId?: string;
        executorName?: string;
        executorEmail?: string;
        beneficiaries: Array<{
            name: string;
            email: string;
            relationship: string;
            accessLevel: string;
        }>;
        finalMessage?: string;
    }) {
        const plan = await prisma.legacyPlan.create({
            data: {
                celebrityId,
                executorUserId: data.executorUserId,
                executorName: data.executorName,
                executorEmail: data.executorEmail,
                beneficiaries: data.beneficiaries,
                scheduledPosts: [],
                privateLetters: [],
                finalMessage: data.finalMessage,
                accountActions: {},
                legalDocuments: [],
                witnessNames: [],
                witnessContacts: [],
            },
        });

        return plan;
    }

    /**
     * Schedule posthumous post
     */
    static async schedulePost(legacyPlanId: string, post: {
        platform: string;
        content: string;
        releaseCondition: string; // IMMEDIATE, AFTER_30_DAYS, ANNIVERSARY, etc
    }) {
        const plan = await prisma.legacyPlan.findUnique({
            where: { id: legacyPlanId },
        });

        if (!plan) {
            throw new Error('Legacy plan not found');
        }

        const scheduledPosts = (plan.scheduledPosts as any[]) || [];
        scheduledPosts.push({
            ...post,
            id: Math.random().toString(36).substring(7),
            createdAt: new Date(),
        });

        await prisma.legacyPlan.update({
            where: { id: legacyPlanId },
            data: { scheduledPosts },
        });

        return { success: true };
    }

    /**
     * Add private letter to loved one
     */
    static async addPrivateLetter(legacyPlanId: string, letter: {
        recipientName: string;
        recipientEmail: string;
        subject: string;
        message: string;
    }) {
        const plan = await prisma.legacyPlan.findUnique({
            where: { id: legacyPlanId },
        });

        if (!plan) {
            throw new Error('Legacy plan not found');
        }

        const privateLetters = (plan.privateLetters as any[]) || [];
        privateLetters.push({
            ...letter,
            id: Math.random().toString(36).substring(7),
            createdAt: new Date(),
        });

        await prisma.legacyPlan.update({
            where: { id: legacyPlanId },
            data: { privateLetters },
        });

        return { success: true };
    }

    /**
     * Get legacy plan
     */
    static async getLegacyPlan(celebrityId: string) {
        return await prisma.legacyPlan.findUnique({
            where: { celebrityId },
            include: {
                executor: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    /**
     * Activate legacy plan (triggered on death)
     */
    static async activateLegacyPlan(legacyPlanId: string) {
        // In production, this would trigger:
        // 1. Notify executor
        // 2. Schedule posthumous posts
        // 3. Send private letters
        // 4. Execute account actions
        // 5. Distribute unreleased content

        await prisma.legacyPlan.update({
            where: { id: legacyPlanId },
            data: { isActive: true },
        });

        return { success: true, message: 'Legacy plan activated' };
    }
}
