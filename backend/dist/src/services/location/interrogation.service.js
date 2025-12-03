"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interrogationService = exports.InterrogationService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
const CONTEXT_QUESTIONS = [
    "Is this your first time at this location?",
    "Who are you with?",
    "Why are you here?",
    "What are you doing?",
    "How do you feel about this place?",
    "What's memorable about this moment?",
];
class InterrogationService {
    /**
     * Generate a location-based prompt
     */
    async generateLocationPrompt(userId, locationId) {
        try {
            const location = await prisma.locationHistory.findUnique({
                where: { id: locationId },
            });
            if (!location) {
                throw new Error('Location not found');
            }
            // Check if prompt already exists for this location
            const existingPrompt = await prisma.locationPrompt.findFirst({
                where: {
                    userId,
                    locationId,
                },
            });
            if (existingPrompt) {
                return existingPrompt;
            }
            // Generate context-aware question
            const question = this.selectQuestion(location);
            const prompt = await prisma.locationPrompt.create({
                data: {
                    userId,
                    locationId,
                    question,
                },
            });
            logger_1.default.info(`Location prompt generated for user ${userId} at location ${locationId}`);
            return prompt;
        }
        catch (error) {
            logger_1.default.error('Error generating location prompt:', error);
            throw error;
        }
    }
    /**
     * Select appropriate question based on location context
     */
    selectQuestion(location) {
        // Simple random selection for MVP
        // In production, this would use AI to generate context-aware questions
        const randomIndex = Math.floor(Math.random() * CONTEXT_QUESTIONS.length);
        return CONTEXT_QUESTIONS[randomIndex];
    }
    /**
     * Get unanswered prompts for a user
     */
    async getUnansweredPrompts(userId) {
        return await prisma.locationPrompt.findMany({
            where: {
                userId,
                answered: false,
            },
            include: {
                location: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    /**
     * Answer a location prompt
     */
    async answerPrompt(promptId, response, photos, audioUrl) {
        try {
            const prompt = await prisma.locationPrompt.update({
                where: { id: promptId },
                data: {
                    response,
                    photos: photos || [],
                    audioUrl,
                    answered: true,
                    answeredAt: new Date(),
                },
            });
            logger_1.default.info(`Location prompt answered: ${promptId}`);
            return prompt;
        }
        catch (error) {
            logger_1.default.error('Error answering prompt:', error);
            throw error;
        }
    }
    /**
     * Trigger geofence prompt (placeholder for mobile implementation)
     */
    async triggerGeofencePrompt(userId, locationId) {
        try {
            // TODO: Implement push notification for mobile
            // For now, just generate the prompt
            const prompt = await this.generateLocationPrompt(userId, locationId);
            logger_1.default.info(`Geofence prompt triggered for user ${userId}`);
            return prompt;
        }
        catch (error) {
            logger_1.default.error('Error triggering geofence prompt:', error);
            throw error;
        }
    }
    /**
     * Get all prompts for a location
     */
    async getLocationPrompts(locationId) {
        return await prisma.locationPrompt.findMany({
            where: { locationId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
exports.InterrogationService = InterrogationService;
exports.interrogationService = new InterrogationService();
