import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Creator analytics
router.get('/snapshot', analyticsController.getCreatorSnapshot);
router.get('/growth', analyticsController.getSubscriberGrowth);
router.get('/performance', analyticsController.getContentPerformance);
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/demographics', analyticsController.getAudienceDemographics);
router.get('/engagement', analyticsController.getEngagementMetrics);

export default router;
