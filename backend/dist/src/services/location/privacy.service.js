"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyService = exports.PrivacyService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const location_service_1 = require("./location.service");
const prisma = new client_1.PrismaClient();
class PrivacyService {
    /**
     * Create a privacy zone
     */
    async createPrivacyZone(userId, data) {
        try {
            const zone = await prisma.privacyZone.create({
                data: {
                    userId,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    radius: data.radius,
                    name: data.name,
                    trackingDisabled: data.trackingDisabled ?? true,
                },
            });
            logger_1.default.info(`Privacy zone created for user ${userId}: ${data.name}`);
            return zone;
        }
        catch (error) {
            logger_1.default.error('Error creating privacy zone:', error);
            throw error;
        }
    }
    /**
     * Get all privacy zones for a user
     */
    async getPrivacyZones(userId) {
        return await prisma.privacyZone.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Delete a privacy zone
     */
    async deletePrivacyZone(zoneId) {
        try {
            await prisma.privacyZone.delete({
                where: { id: zoneId },
            });
            logger_1.default.info(`Privacy zone deleted: ${zoneId}`);
        }
        catch (error) {
            logger_1.default.error('Error deleting privacy zone:', error);
            throw error;
        }
    }
    /**
     * Update a privacy zone
     */
    async updatePrivacyZone(zoneId, data) {
        try {
            const zone = await prisma.privacyZone.update({
                where: { id: zoneId },
                data,
            });
            logger_1.default.info(`Privacy zone updated: ${zoneId}`);
            return zone;
        }
        catch (error) {
            logger_1.default.error('Error updating privacy zone:', error);
            throw error;
        }
    }
    /**
     * Check if location is private
     */
    async checkLocationPrivacy(userId, latitude, longitude) {
        return await location_service_1.locationService.isInPrivacyZone(userId, latitude, longitude);
    }
}
exports.PrivacyService = PrivacyService;
exports.privacyService = new PrivacyService();
