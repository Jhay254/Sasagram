import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as celebrityController from '../controllers/celebrity.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard & Overview
router.get('/dashboard', celebrityController.getDashboard);

// Reputation & Sentiment
router.get('/reputation', celebrityController.getReputationScore);
router.get('/sentiment/timeline', celebrityController.getSentimentTimeline);

// NFT Management
router.post('/nft/collection', celebrityController.createNFTCollection);
router.post('/nft/mint', celebrityController.mintCareerMoment);

// Legacy Planning
router.post('/legacy/plan', celebrityController.createLegacyPlan);
router.post('/legacy/schedule-post', celebrityController.schedulePosthumousPost);

export default router;
