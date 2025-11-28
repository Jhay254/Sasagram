import { Router } from 'express';
import {
    authenticate,
    logout,
    getCurrentUser
} from '../middleware/auth';
import {
    authRateLimiter,
    verificationRateLimiter,
    passwordResetRateLimiter
} from '../middleware/rateLimiter';
import * as authController from '../controllers/authController';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/verify-email', verificationRateLimiter, authController.verifyEmail);
router.post('/resend-verification', verificationRateLimiter, authController.resendVerification);
router.post('/forgot-password', passwordResetRateLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetRateLimiter, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
