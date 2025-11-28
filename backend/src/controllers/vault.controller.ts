import { Request, Response } from 'express';
import { VaultService } from '../services/vault.service';

/**
 * Create vault content
 * POST /api/vault/create
 */
export const createVaultContent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { title, content, contentType, requiresBiometric, requiresPIN } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const vaultContent = await VaultService.createVaultContent(userId, {
            title,
            content,
            contentType,
            requiresBiometric,
            requiresPIN,
        });

        res.status(201).json({ success: true, vaultContent });
    } catch (error: any) {
        console.error('Error creating vault content:', error);
        res.status(500).json({ error: error.message || 'Failed to create vault content' });
    }
};

/**
 * Access vault content (with MFA)
 * POST /api/vault/:id/access
 */
export const accessVaultContent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;
        const { biometricVerified, pinVerified, deviceId, ipAddress, geoLocation } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await VaultService.accessVaultContent(userId, id, {
            biometricVerified,
            pinVerified,
            deviceId,
            ipAddress: ipAddress || req.ip,
            geoLocation,
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error accessing vault content:', error);
        res.status(403).json({ error: error.message || 'Access denied' });
    }
};

/**
 * Get user's vault content list
 * GET /api/vault
 */
export const getUserVaultContent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const vaultContent = await VaultService.getUserVaultContent(userId);

        res.json({ count: vaultContent.length, vaultContent });
    } catch (error: any) {
        console.error('Error getting vault content:', error);
        res.status(500).json({ error: error.message || 'Failed to get vault content' });
    }
};

/**
 * Verify access token
 * POST /api/vault/verify-token
 */
export const verifyAccessToken = async (req: Request, res: Response) => {
    try {
        const { accessToken } = req.body;

        const result = VaultService.verifyAccessToken(accessToken);

        res.json(result);
    } catch (error: any) {
        console.error('Error verifying access token:', error);
        res.status(500).json({ error: 'Invalid token' });
    }
};

/**
 * Delete vault content
 * DELETE /api/vault/:id
 */
export const deleteVaultContent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await VaultService.deleteVaultContent(userId, id);

        res.json({ success: true, message: 'Vault content deleted' });
    } catch (error: any) {
        console.error('Error deleting vault content:', error);
        res.status(500).json({ error: error.message || 'Failed to delete vault content' });
    }
};
