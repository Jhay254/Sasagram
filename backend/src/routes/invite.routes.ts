import { Router, Request, Response } from 'express';
import { inviteService } from '../services/invite.service';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /invite/{token}:
 *   get:
 *     summary: Get invite landing page data (public)
 *     tags: [Invite]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite data for landing page
 */
router.get('/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const inviteData = await inviteService.getInviteData(token);

        res.json({
            success: true,
            data: inviteData,
        });
    } catch (error: any) {
        logger.error('Error fetching invite data:', error);
        res.status(400).json({
            error: error.message || 'Invalid invite link',
        });
    }
});

/**
 * @swagger
 * /invite/{token}/claim:
 *   post:
 *     summary: Claim invite and register user (public)
 *     tags: [Invite]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered and invite claimed
 */
router.post('/:token/claim', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields: name, email, password',
            });
        }

        const result = await inviteService.claimInvite(token, {
            name,
            email,
            password,
        });

        res.json({
            success: true,
            data: result,
            message: 'Account created successfully! You can now log in.',
        });
    } catch (error: any) {
        logger.error('Error claiming invite:', error);
        res.status(400).json({
            error: error.message || 'Failed to claim invite',
        });
    }
});

/**
 * @swagger
 * /invite/{token}/preview:
 *   get:
 *     summary: Get social sharing preview data (public)
 *     tags: [Invite]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Open Graph preview data
 */
router.get('/:token/preview', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const preview = await inviteService.generateSocialPreview(token);

        res.json({
            success: true,
            data: preview,
        });
    } catch (error: any) {
        logger.error('Error generating preview:', error);
        res.status(400).json({
            error: error.message || 'Failed to generate preview',
        });
    }
});

export default router;
