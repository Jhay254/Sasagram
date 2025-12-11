import { Request, Response } from 'express';
import { creatorService } from '../services/creator.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class CreatorController {
    async onboard(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { username, displayName, bio, categories } = req.body;

            if (!username || !displayName || !bio || !categories) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const creator = await creatorService.onboardCreator(userId, {
                username,
                displayName,
                bio,
                categories,
            });

            res.json({
                success: true,
                creator,
                message: 'Welcome to the creator community!',
            });
        } catch (error: any) {
            console.error('Error onboarding creator:', error);
            res.status(400).json({ error: error.message || 'Failed to onboard creator' });
        }
    }
}

export const creatorController = new CreatorController();
