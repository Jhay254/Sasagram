import { Router, Request, Response } from 'express';
import { Queue } from 'bullmq';
import { BiographyGenerationJobData } from '../jobs/biography-generation.job';
import { NarrativeStyle } from '../types/narrative';
import { logger } from '../utils/logger';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const REDIS_CONNECTION = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
};

// Initialize biography queue
const biographyQueue = new Queue('biography-generation', {
    connection: REDIS_CONNECTION,
});

/**
 * POST /api/biography/generate
 * Start biography generation
 */
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Use authenticated user's ID - prevent unauthorized generation
        const userId = req.user!.id;
        const { style, options } = req.body;

        if (!style || !Object.values(NarrativeStyle).includes(style)) {
            return res.status(400).json({ error: 'Valid style is required' });
        }

        // Add job to queue
        const jobData: BiographyGenerationJobData = {
            userId,
            style: style as NarrativeStyle,
            options: {
                includeMedia: options?.includeMedia ?? true,
                includeSentiment: options?.includeSentiment ?? true,
                chapterOptions: options?.chapterOptions ?? {
                    minEventsPerChapter: 5,
                    useAI: true,
                },
            },
        };

        const job = await biographyQueue.add('generate-biography', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        });

        logger.info(`Biography generation job ${job.id} created for user ${userId}`);

        res.json({
            jobId: job.id,
            status: 'queued',
            message: 'Biography generation started',
        });
    } catch (error: any) {
        logger.error('Error creating biography generation job:', error);
        res.status(500).json({ error: 'Failed to start biography generation' });
    }
});

/**
 * GET /api/biography/status/:jobId
 * Check job status
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;
        const job = await biographyQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress;
        const result = job.returnvalue;

        res.json({
            jobId: job.id,
            status: state,
            progress,
            result,
            createdAt: job.timestamp,
            processedAt: job.processedOn,
            finishedAt: job.finishedOn,
        });
    } catch (error: any) {
        logger.error('Error getting job status:', error);
        res.status(500).json({ error: 'Failed to get job status' });
    }
});

/**
 * GET /api/biography/:biographyId
 * Get generated biography
 */
router.get('/:biographyId', async (req: Request, res: Response) => {
    try {
        const { biographyId } = req.params;

        // TODO: Implement database retrieval
        // For now, return placeholder
        res.json({
            id: biographyId,
            message: 'Biography retrieval not yet implemented',
        });
    } catch (error: any) {
        logger.error('Error getting biography:', error);
        res.status(500).json({ error: 'Failed to get biography' });
    }
});

/**
 * GET /api/biography/user/:userId
 * List user's biographies
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // TODO: Implement database query
        // For now, return empty array
        res.json({
            userId,
            biographies: [],
            message: 'Biography listing not yet implemented',
        });
    } catch (error: any) {
        logger.error('Error listing biographies:', error);
        res.status(500).json({ error: 'Failed to list biographies' });
    }
});

export default router;
