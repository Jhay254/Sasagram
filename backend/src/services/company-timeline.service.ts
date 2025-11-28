import prisma from '../db/prisma';

/**
 * Company Timeline Service - Collaborative timeline builder
 * Features: Multi-source milestones, auto-import, RBAC visibility
 */
export class CompanyTimelineService {
    /**
     * Create timeline milestone
     */
    static async createMilestone(data: {
        organizationId: string;
        title: string;
        description: string;
        category: string;
        date: Date;
        imageUrl?: string;
        videoUrl?: string;
        isPublic?: boolean;
        isRecruiting?: boolean;
        isInvestor?: boolean;
        createdBy: string;
    }) {
        const milestone = await prisma.companyTimeline.create({
            data: {
                ...data,
                source: 'MANUAL',
            },
        });

        return milestone;
    }

    /**
     * Auto-import milestone from integration
     */
    static async importFromIntegration(
        organizationId: string,
        source: string,
        data: {
            title: string;
            description: string;
            category: string;
            date: Date;
            sourceId: string;
            sourceData: any;
        },
        createdBy: string
    ) {
        // Check if already imported
        const existing = await prisma.companyTimeline.findFirst({
            where: {
                organizationId,
                source,
                sourceId: data.sourceId,
            },
        });

        if (existing) {
            return existing;
        }

        // Create new milestone
        const milestone = await prisma.companyTimeline.create({
            data: {
                organizationId,
                ...data,
                source,
                createdBy,
            },
        });

        return milestone;
    }

    /**
     * Get company timeline
     */
    static async getTimeline(
        organizationId: string,
        filters?: {
            category?: string;
            startDate?: Date;
            endDate?: Date;
            source?: string;
        }
    ) {
        const where: any = { organizationId };

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) {
                where.date.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.date.lte = filters.endDate;
            }
        }

        if (filters?.source) {
            where.source = filters.source;
        }

        return await prisma.companyTimeline.findMany({
            where,
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Get recruiting timeline (public-facing)
     */
    static async getRecruitingTimeline(organizationId: string) {
        return await prisma.companyTimeline.findMany({
            where: {
                organizationId,
                isRecruiting: true,
            },
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Get investor relations timeline
     */
    static async getInvestorTimeline(organizationId: string) {
        return await prisma.companyTimeline.findMany({
            where: {
                organizationId,
                isInvestor: true,
            },
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Update milestone
     */
    static async updateMilestone(
        id: string,
        data: {
            title?: string;
            description?: string;
            category?: string;
            date?: Date;
            imageUrl?: string;
            videoUrl?: string;
            isPublic?: boolean;
            isRecruiting?: boolean;
            isInvestor?: boolean;
        }
    ) {
        return await prisma.companyTimeline.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete milestone
     */
    static async deleteMilestone(id: string) {
        await prisma.companyTimeline.delete({
            where: { id },
        });
    }

    /**
     * Get timeline statistics
     */
    static async getTimelineStats(organizationId: string) {
        const milestones = await prisma.companyTimeline.findMany({
            where: { organizationId },
        });

        const byCategory = milestones.reduce((acc, m) => {
            acc[m.category] = (acc[m.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const bySource = milestones.reduce((acc, m) => {
            acc[m.source] = (acc[m.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: milestones.length,
            byCategory,
            bySource,
            public: milestones.filter((m) => m.isPublic).length,
            recruiting: milestones.filter((m) => m.isRecruiting).length,
            investor: milestones.filter((m) => m.isInvestor).length,
        };
    }
}
