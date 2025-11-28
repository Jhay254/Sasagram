import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    uploadAvatar,
    updateProfileValidation,
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All profile routes require authentication
router.get('/:userId', getProfile);
router.put('/', authenticate, updateProfileValidation, updateProfile);
router.post('/avatar', authenticate, uploadAvatar);

export default router;
