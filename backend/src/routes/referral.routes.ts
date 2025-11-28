import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as referralController from '../controllers/referral.controller';

const router = Router();

// Public routes
router.get('/leaderboard', referralController.getReferralLeaderboard);

// Protected routes
router.use(authenticate);

// Get or create referral code
router.get('/code', referralController.getMyReferralCode);

// Get referral statistics
router.get('/stats', referralController.getReferralStats);

// Get referral history
router.get('/history', referralController.getReferralHistory);

// Get referral rewards
router.get('/rewards', referralController.getReferralRewards);

// Get referral milestones
router.get('/milestones', referralController.getReferralMilestones);

// Send referral invitation
router.post('/invite', referralController.sendReferralInvitation);

export default router;
