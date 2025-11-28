import { Request, Response } from 'express';
import { SentimentAnalysisService } from '../services/sentiment-analysis.service';
import { CelebrityNFTService } from '../services/celebrity-nft.service';
import { LegacyManagementService } from '../services/legacy-management.service';
import { CelebrityAnalyticsService } from '../services/celebrity-analytics.service';

const sentimentService = new SentimentAnalysisService();

/**
 * Celebrity Profile & Dashboard
 */
export const getDashboard = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        const profile = await prisma.celebrityProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Celebrity profile not found' });
        }

        const dashboard = await CelebrityAnalyticsService.getDashboardOverview(profile.id);
        const reputation = await sentimentService.getReputationScore(profile.id);

        res.json({
            ...dashboard,
            reputation,
        });
    } catch (error: any) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get reputation score
 */
export const getReputationScore = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { days = 30 } = req.query;

        const profile = await prisma.celebrityProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Celebrity profile not found' });
        }

        const reputation = await sentimentService.getReputationScore(profile.id, Number(days));

        res.json(reputation);
    } catch (error: any) {
        console.error('Error fetching reputation:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get sentiment timeline
 */
export const getSentimentTimeline = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { days = 90 } = req.query;

        const profile = await prisma.celebrityProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Celebrity profile not found' });
        }

        const timeline = await sentimentService.getSentimentTimeline(profile.id, Number(days));

        res.json(timeline);
    } catch (error: any) {
        console.error('Error fetching sentiment timeline:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * NFT - Create collection
 */
export const createNFTCollection = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { collectionName, collectionSymbol, description } = req.body;

        const profile = await prisma.celebrityProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Celebrity profile not found' });
        }

        const collection = await CelebrityNFTService.createCollection(profile.id, {
            collectionName,
            collectionSymbol,
            description,
        });

        res.json(collection);
    } catch (error: any) {
        console.error('Error creating NFT collection:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * NFT - Mint career moment
 */
export const mintCareerMoment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { name, description, category, imageUrl, videoUrl, attributes } = req.body;

        const profile = await prisma.celebrityProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Celebrity profile not found' });
        }

        const nft = await CelebrityNFTService.mintCareerMoment(profile.id, {
            name,
            description,
            category,
            imageUrl,
            videoUrl,
            attributes,
        });

        res.json(nft);
    } catch (error: any) {
        console.error('Error minting NFT:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Legacy - Create legacy plan
 */
export const createLegacyPlan = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { executorUserId, executorName, executorEmail, beneficiaries, finalMessage } = req.body;

        const profile = await prisma.celebrityProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Celebrity profile not found' });
        }

        const legacyPlan = await LegacyManagementService.createLegacyPlan(profile.id, {
            executorUserId,
            executorName,
            executorEmail,
            beneficiaries,
            finalMessage,
        });

        res.json(legacyPlan);
    } catch (error: any) {
        console.error('Error creating legacy plan:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Legacy - Schedule posthumous post
 */
export const schedulePosthumousPost = async (req: Request, res: Response) => {
    try {
        const { platform, content, releaseCondition } = req.body;
        const userId = (req as any).user?.userId;

        const profile = await prisma.celebrityProfile.findUnique({
            where: { userId },
            include: { legacyPlan: true },
        });

        if (!profile?.legacyPlan) {
            return res.status(404).json({ error: 'Legacy plan not found' });
        }

        await LegacyManagementService.schedulePost(profile.legacyPlan.id, {
            platform,
            content,
            releaseCondition,
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error scheduling post:', error);
        res.status(500).json({ error: error.message });
    }
};
