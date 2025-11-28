import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';

/**
 * Save location
 */
export async function saveLocation(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { latitude, longitude, accuracy, metadata } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const location = await LocationService.saveLocation(
            userId,
            latitude,
            longitude,
            accuracy,
            metadata
        );

        res.json({
            success: true,
            data: location,
        });
    } catch (error: any) {
        console.error('Error saving location:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get location history
 */
export async function getLocationHistory(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { startDate, endDate, limit = 100 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const history = await LocationService.getLocationHistory(
            userId,
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined,
            Number(limit)
        );

        res.json({
            success: true,
            data: history,
        });
    } catch (error: any) {
        console.error('Error getting history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get location privacy settings
 */
export async function getLocationPrivacy(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const privacy = await LocationService.getLocationPrivacy(userId);

        res.json({
            success: true,
            data: privacy,
        });
    } catch (error: any) {
        console.error('Error getting privacy:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Update location privacy
 */
export async function updateLocationPrivacy(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const privacy = await LocationService.updateLocationPrivacy(userId, req.body);

        res.json({
            success: true,
            data: privacy,
        });
    } catch (error: any) {
        console.error('Error updating privacy:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Check nearby memories
 */
export async function checkNearbyMemories(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { latitude, longitude, radius = 1 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const memories = await LocationService.checkNearbyMemories(
            userId,
            Number(latitude),
            Number(longitude),
            Number(radius)
        );

        res.json({
            success: true,
            data: memories,
        });
    } catch (error: any) {
        console.error('Error checking nearby:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Delete location history
 */
export async function deleteLocationHistory(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { beforeDate } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await LocationService.deleteLocationHistory(
            userId,
            beforeDate ? new Date(beforeDate as string) : undefined
        );

        res.json({
            success: true,
            message: 'Location history deleted',
        });
    } catch (error: any) {
        console.error('Error deleting history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
