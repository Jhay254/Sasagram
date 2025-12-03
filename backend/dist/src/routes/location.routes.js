"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const location_service_1 = require("../services/location/location.service");
const privacy_service_1 = require("../services/location/privacy.service");
const interrogation_service_1 = require("../services/location/interrogation.service");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
/**
 * POST /api/location/record
 * Record a location point
 */
router.post('/record', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude, accuracy, placeName, placeType } = req.body;
        if (!latitude || !longitude || !accuracy) {
            return res.status(400).json({ error: 'latitude, longitude, and accuracy are required' });
        }
        const location = await location_service_1.locationService.recordLocation(userId, {
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
    }
    catch (error) {
        logger_1.default.error('Error recording location:', error);
        res.status(500).json({ error: 'Failed to record location' });
    }
});
/**
 * GET /api/location/history
 * Get location history
 */
router.get('/history', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, limit } = req.query;
        const history = await location_service_1.locationService.getLocationHistory(userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, limit ? parseInt(limit) : undefined);
        res.json(history);
    }
    catch (error) {
        logger_1.default.error('Error fetching location history:', error);
        res.status(500).json({ error: 'Failed to fetch location history' });
    }
});
/**
 * GET /api/location/significant
 * Get significant locations
 */
router.get('/significant', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const locations = await location_service_1.locationService.getSignificantLocations(userId);
        res.json(locations);
    }
    catch (error) {
        logger_1.default.error('Error fetching significant locations:', error);
        res.status(500).json({ error: 'Failed to fetch significant locations' });
    }
});
/**
 * POST /api/location/privacy-zone
 * Create a privacy zone
 */
router.post('/privacy-zone', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude, radius, name, trackingDisabled } = req.body;
        if (!latitude || !longitude || !radius || !name) {
            return res.status(400).json({ error: 'latitude, longitude, radius, and name are required' });
        }
        const zone = await privacy_service_1.privacyService.createPrivacyZone(userId, {
            latitude,
            longitude,
            radius,
            name,
            trackingDisabled,
        });
        res.json(zone);
    }
    catch (error) {
        logger_1.default.error('Error creating privacy zone:', error);
        res.status(500).json({ error: 'Failed to create privacy zone' });
    }
});
/**
 * GET /api/location/privacy-zones
 * Get all privacy zones
 */
router.get('/privacy-zones', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const zones = await privacy_service_1.privacyService.getPrivacyZones(userId);
        res.json(zones);
    }
    catch (error) {
        logger_1.default.error('Error fetching privacy zones:', error);
        res.status(500).json({ error: 'Failed to fetch privacy zones' });
    }
});
/**
 * DELETE /api/location/privacy-zone/:id
 * Delete a privacy zone
 */
router.delete('/privacy-zone/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await privacy_service_1.privacyService.deletePrivacyZone(id);
        res.json({ message: 'Privacy zone deleted' });
    }
    catch (error) {
        logger_1.default.error('Error deleting privacy zone:', error);
        res.status(500).json({ error: 'Failed to delete privacy zone' });
    }
});
/**
 * GET /api/location/prompts
 * Get unanswered location prompts
 */
router.get('/prompts', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const prompts = await interrogation_service_1.interrogationService.getUnansweredPrompts(userId);
        res.json(prompts);
    }
    catch (error) {
        logger_1.default.error('Error fetching prompts:', error);
        res.status(500).json({ error: 'Failed to fetch prompts' });
    }
});
/**
 * POST /api/location/prompts/:id/answer
 * Answer a location prompt
 */
router.post('/prompts/:id/answer', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { response, photos, audioUrl } = req.body;
        if (!response) {
            return res.status(400).json({ error: 'response is required' });
        }
        const prompt = await interrogation_service_1.interrogationService.answerPrompt(id, response, photos, audioUrl);
        res.json(prompt);
    }
    catch (error) {
        logger_1.default.error('Error answering prompt:', error);
        res.status(500).json({ error: 'Failed to answer prompt' });
    }
});
exports.default = router;
