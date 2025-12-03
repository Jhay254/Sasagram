import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { locationService } from '../services/location/location.service';
import { privacyService } from '../services/location/privacy.service';
import { interrogationService } from '../services/location/interrogation.service';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/location/record
 * Record a location point
 */
router.post('/record', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { latitude, longitude, accuracy, placeName, placeType } = req.body;

        if (!latitude || !longitude || !accuracy) {
            return res.status(400).json({ error: 'latitude, longitude, and accuracy are required' });
        }

        const location = await locationService.recordLocation(userId, {
            latitude,
            longitude,
            accuracy,
            placeName,
            placeType,
        });

        if (!location) {
            return res.json({ message: 'Location in privacy zone - not recorded' });
        }

        res.json(location);
    } catch (error) {
        logger.error('Error recording location:', error);
        res.status(500).json({ error: 'Failed to record location' });
    }
});

/**
 * GET /api/location/history
 * Get location history
 */
router.get('/history', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { startDate, endDate, limit } = req.query;

        const history = await locationService.getLocationHistory(
            userId,
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined,
            limit ? parseInt(limit as string) : undefined
        );

        res.json(history);
    } catch (error) {
        logger.error('Error fetching location history:', error);
        res.status(500).json({ error: 'Failed to fetch location history' });
    }
});

/**
 * GET /api/location/significant
 * Get significant locations
 */
router.get('/significant', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const locations = await locationService.getSignificantLocations(userId);
        res.json(locations);
    } catch (error) {
        logger.error('Error fetching significant locations:', error);
        res.status(500).json({ error: 'Failed to fetch significant locations' });
    }
});

/**
 * POST /api/location/privacy-zone
 * Create a privacy zone
 */
router.post('/privacy-zone', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { latitude, longitude, radius, name, trackingDisabled } = req.body;

        if (!latitude || !longitude || !radius || !name) {
            return res.status(400).json({ error: 'latitude, longitude, radius, and name are required' });
        }

        const zone = await privacyService.createPrivacyZone(userId, {
            latitude,
            longitude,
            radius,
            name,
            trackingDisabled,
        });

        res.json(zone);
    } catch (error) {
        logger.error('Error creating privacy zone:', error);
        res.status(500).json({ error: 'Failed to create privacy zone' });
    }
});

/**
 * GET /api/location/privacy-zones
 * Get all privacy zones
 */
router.get('/privacy-zones', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const zones = await privacyService.getPrivacyZones(userId);
        res.json(zones);
    } catch (error) {
        logger.error('Error fetching privacy zones:', error);
        res.status(500).json({ error: 'Failed to fetch privacy zones' });
    }
});

/**
 * DELETE /api/location/privacy-zone/:id
 * Delete a privacy zone
 */
router.delete('/privacy-zone/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        await privacyService.deletePrivacyZone(id);
        res.json({ message: 'Privacy zone deleted' });
    } catch (error) {
        logger.error('Error deleting privacy zone:', error);
        res.status(500).json({ error: 'Failed to delete privacy zone' });
    }
});

/**
 * GET /api/location/prompts
 * Get unanswered location prompts
 */
router.get('/prompts', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const prompts = await interrogationService.getUnansweredPrompts(userId);
        res.json(prompts);
    } catch (error) {
        logger.error('Error fetching prompts:', error);
        res.status(500).json({ error: 'Failed to fetch prompts' });
    }
});

/**
 * POST /api/location/prompts/:id/answer
 * Answer a location prompt
 */
router.post('/prompts/:id/answer', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { response, photos, audioUrl } = req.body;

        if (!response) {
            return res.status(400).json({ error: 'response is required' });
        }

        const prompt = await interrogationService.answerPrompt(id, response, photos, audioUrl);
        res.json(prompt);
    } catch (error) {
        logger.error('Error answering prompt:', error);
        res.status(500).json({ error: 'Failed to answer prompt' });
    }
});

export default router;
