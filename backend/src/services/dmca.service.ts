import prisma from '../db/prisma';
import { addDays } from 'date-fns';

/**
 * DMCA Service - Automated takedown processing
 * Features: Automated content removal, counter-notice workflow, legal compliance
 */
export class DMCAService {
    /**
     * Submit DMCA takedown request (automated processing)
     */
    static async submitTakedownRequest(data: {
        requesterId: string;
        requesterEmail: string;
        requesterName: string;
        infringingUrl: string;
        originalWork: string;
        copyrightOwner: string;
        registrationNumber?: string;
        evidenceUrls: string[];
        description: string;
        signatureData: any;
    }) {
        // Validate DMCA requirements
        this.validateDMCARequest(data);

        // Find alleged infringer by URL
        const infringerId = await this.findInfringerByUrl(data.infringingUrl);

        // Create takedown request
        const takedown = await prisma.dmCATakedown.create({
            data: {
                requesterId: data.requesterId,
                requesterEmail: data.requesterEmail,
                requesterName: data.requesterName,
                infringerId,
                infringingUrl: data.infringingUrl,
                originalWork: data.originalWork,
                copyrightOwner: data.copyrightOwner,
                registrationNumber: data.registrationNumber,
                evidenceUrls: data.evidenceUrls,
                description: data.description,
                signatureData: data.signatureData,
                status: 'PENDING',
                automatedAction: true,
                underPenalty: true,
            },
        });

        // Automated processing: Remove content immediately
        await this.processAutomatedTakedown(takedown.id);

        return takedown;
    }

    /**
     * Process automated takedown (remove content immediately)
     */
    private static async processAutomatedTakedown(takedownId: string) {
        const takedown = await prisma.dmCATakedown.findUnique({
            where: { id: takedownId },
        });

        if (!takedown) return;

        // Update status to processing
        await prisma.dmCATakedown.update({
            where: { id: takedownId },
            data: {
                status: 'PROCESSING',
                processedAt: new Date(),
            },
        });

        // Remove/hide content (implementation depends on content type)
        // TODO: Implement content removal logic based on infringingUrl

        // Notify alleged infringer
        if (takedown.infringerId) {
            await this.sendDMCANotice(takedown);
        }

        // Update status to content removed
        await prisma.dmCATakedown.update({
            where: { id: takedownId },
            data: {
                status: 'CONTENT_REMOVED',
                reviewNotes: 'Content automatically removed per DMCA request',
            },
        });
    }

    /**
     * Submit counter-notice (10-14 day restoration process)
     */
    static async submitCounterNotice(takedownId: string, data: {
        userId: string;
        name: string;
        email: string;
        address: string;
        statement: string;
    }) {
        const takedown = await prisma.dmCATakedown.findUnique({
            where: { id: takedownId },
        });

        if (!takedown) {
            throw new Error('Takedown request not found');
        }

        if (takedown.status !== 'CONTENT_REMOVED') {
            throw new Error('Content must be removed before filing counter-notice');
        }

        // Calculate restoration date (14 business days)
        const restorationDate = addDays(new Date(), 14);

        // Create counter-notice
        const counterNotice = await prisma.dmCACounterNotice.create({
            data: {
                takedownId,
                userId: data.userId,
                name: data.name,
                email: data.email,
                address: data.address,
                statement: data.statement,
                goodFaithBelief: true,
                consentToJurisdiction: true,
                status: 'SUBMITTED',
                scheduledRestorationDate: restorationDate,
            },
        });

        // Update takedown status
        await prisma.dmCATakedown.update({
            where: { id: takedownId },
            data: { status: 'COUNTER_NOTICED' },
        });

        // Notify original requester
        await this.sendCounterNoticeToRequester(counterNotice);

        // Schedule automatic restoration
        this.scheduleContentRestoration(takedownId, 14);

        return counterNotice;
    }

    /**
     * Get user's DMCA requests
     */
    static async getUserTakedownRequests(userId: string, filter?: 'sent' | 'received') {
        const where: any = {};

        if (filter === 'sent') {
            where.requesterId = userId;
        } else if (filter === 'received') {
            where.infringerId = userId;
        } else {
            where.OR = [{ requesterId: userId }, { infringerId: userId }];
        }

        return await prisma.dmCATakedown.findMany({
            where,
            include: {
                requester: { select: { id: true, name: true, email: true } },
                infringer: { select: { id: true, name: true, email: true } },
                counterNotice: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get takedown status
     */
    static async getTakedownStatus(takedownId: string) {
        return await prisma.dmCATakedown.findUnique({
            where: { id: takedownId },
            include: {
                counterNotice: true,
            },
        });
    }

    // ========== Private Helper Methods ==========

    /**
     * Validate DMCA request requirements
     */
    private static validateDMCARequest(data: any) {
        const required = [
            'requesterEmail',
            'requesterName',
            'infringingUrl',
            'originalWork',
            'copyrightOwner',
            'description',
            'signatureData',
        ];

        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate evidence
        if (!data.evidenceUrls || data.evidenceUrls.length === 0) {
            throw new Error('At least one evidence URL is required');
        }
    }

    /**
     * Find infringer by URL pattern matching
     */
    private static async findInfringerByUrl(url: string): Promise<string | null> {
        // TODO: Implement URL pattern matching to find content owner
        // This would parse the URL and find the user who owns that content
        return null;
    }

    /**
     * Send DMCA notice to alleged infringer
     */
    private static async sendDMCANotice(takedown: any) {
        // TODO: Send email notification with DMCA notice
        console.log(`Sending DMCA notice to user ${takedown.infringerId}`);
    }

    /**
     * Send counter-notice to original requester
     */
    private static async sendCounterNoticeToRequester(counterNotice: any) {
        // TODO: Send email notification to original requester
        console.log(`Sending counter-notice to requester`);
    }

    /**
     * Schedule content restoration (called after 10-14 days if no objection)
     */
    private static scheduleContentRestoration(takedownId: string, days: number) {
        // TODO: Implement scheduled job to restore content after X days
        console.log(`Scheduling content restoration for takedown ${takedownId} in ${days} days`);
    }
}
