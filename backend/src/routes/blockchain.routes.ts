import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as blockchainController from '../controllers/blockchain.controller';

const router = Router();

// Prepare verification (authenticated)
router.post(
    '/prepare',
    authenticate,
    blockchainController.upload.single('content'),
    blockchainController.prepareVerification
);

// Confirm verification after user signs transaction (authenticated)
router.post('/confirm', authenticate, blockchainController.confirmVerification);

// Get verification status (authenticated)
router.get('/:id/status', authenticate, blockchainController.getVerificationStatus);

// Get blockchain proof (authenticated)
router.get('/proof/:hash', authenticate, blockchainController.getBlockchainProof);

// Get user's verifications (authenticated)
router.get('/user', authenticate, blockchainController.getUserVerifications);

// Public verification (no auth required)
router.get('/verify-public/:hash', blockchainController.verifyPublicly);

export default router;
