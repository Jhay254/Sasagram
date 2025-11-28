import { Request, Response } from 'express';
import { NDAService } from '../services/nda.service';

/**
 * Get current NDA
 * GET /api/nda/current
 */
export const getCurrentNDA = async (req: Request, res: Response) => {
    try {
        const nda = await NDAService.getCurrentNDA();

        res.json(nda);
    } catch (error: any) {
        console.error('Error getting NDA:', error);
        res.status(500).json({ error: error.message || 'Failed to get NDA' });
    }
};

/**
 * Sign NDA with biometric authentication
 * POST /api/nda/sign
 */
export const signNDA = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { biometricData, readingMetrics } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!biometricData) {
            return res.status(400).json({ error: 'Biometric authentication required' });
        }

        if (!readingMetrics) {
            return res.status(400).json({ error: 'Reading metrics required' });
        }

        // Get device info
        const deviceInfo = {
            deviceId: req.headers['x-device-id'] || 'unknown',
            deviceType: req.headers['x-device-type'] || 'web',
            ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
            geoLocation: req.headers['x-geo-location'] as string,
            userAgent: req.headers['user-agent'] || '',
        };

        const signature = await NDAService.signNDA(userId, biometricData, deviceInfo, readingMetrics);

        res.json({
            success: true,
            message: 'NDA signed successfully',
            signature: {
                id: signature.id,
                signedAt: signature.signedAt,
                version: signature.ndaVersion,
            },
        });
    } catch (error: any) {
        console.error('Error signing NDA:', error);
        res.status(400).json({ error: error.message || 'Failed to sign NDA' });
    }
};

/**
 * Check NDA status
 * GET /api/nda/status
 */
export const getNDAStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const hasValidNDA = await NDAService.hasValidNDA(userId);
        const signature = hasValidNDA ? await NDAService.getUserSignature(userId) : null;

        res.json({
            hasValidNDA,
            signature: signature ? {
                version: signature.ndaVersion,
                signedAt: signature.signedAt,
                biometricType: signature.biometricType,
            } : null,
        });
    } catch (error: any) {
        console.error('Error getting NDA status:', error);
        res.status(500).json({ error: error.message || 'Failed to get NDA status' });
    }
};
