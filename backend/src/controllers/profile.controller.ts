import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Validation rules
export const updateProfileValidation = [
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('displayName').optional().trim(),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('avatarUrl').optional().isURL(),
];

// Get user profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                emailVerified: true,
                status: true,
                createdAt: true,
                biography: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        isPublic: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { firstName, lastName, displayName, bio, avatarUrl } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                firstName,
                lastName,
                displayName,
                bio,
                avatarUrl,
            },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                emailVerified: true,
                status: true,
            },
        });

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Upload avatar (placeholder - actual file upload would need multer or similar)
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // TODO: Implement actual file upload with multer + S3/Cloud Storage
        res.status(501).json({ error: 'Avatar upload not yet implemented' });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
};
