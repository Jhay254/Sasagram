import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';
import { locationService } from './location.service';

const prisma = new PrismaClient();

interface PrivacyZoneData {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
    trackingDisabled?: boolean;
}

export class PrivacyService {
    /**
     * Create a privacy zone
     */
    async createPrivacyZone(userId: string, data: PrivacyZoneData) {
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

            logger.info(`Privacy zone created for user ${userId}: ${data.name}`);
            return zone;
        } catch (error) {
            logger.error('Error creating privacy zone:', error);
            throw error;
        }
    }

    /**
     * Get all privacy zones for a user
     */
    async getPrivacyZones(userId: string) {
        return await prisma.privacyZone.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Delete a privacy zone
     */
    async deletePrivacyZone(zoneId: string) {
        try {
            await prisma.privacyZone.delete({
                where: { id: zoneId },
            });

            logger.info(`Privacy zone deleted: ${zoneId}`);
        } catch (error) {
            logger.error('Error deleting privacy zone:', error);
            throw error;
        }
    }

    /**
     * Update a privacy zone
     */
    async updatePrivacyZone(zoneId: string, data: Partial<PrivacyZoneData>) {
        try {
            const zone = await prisma.privacyZone.update({
                where: { id: zoneId },
                data,
            });

            logger.info(`Privacy zone updated: ${zoneId}`);
            return zone;
        } catch (error) {
            logger.error('Error updating privacy zone:', error);
            throw error;
        }
    }

    /**
     * Check if location is private
     */
    async checkLocationPrivacy(userId: string, latitude: number, longitude: number): Promise<boolean> {
        return await locationService.isInPrivacyZone(userId, latitude, longitude);
    }
}

export const privacyService = new PrivacyService();
