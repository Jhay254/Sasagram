import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp?: Date;
    placeName?: string;
    placeType?: string;
}

export class LocationService {
    /**
     * Record a location point
     */
    async recordLocation(userId: string, data: LocationData) {
        try {
            // Check if location is in a privacy zone
            const inPrivacyZone = await this.isInPrivacyZone(userId, data.latitude, data.longitude);

            if (inPrivacyZone) {
                logger.info(`Location recording skipped - in privacy zone for user ${userId}`);
                return null;
            }

            const location = await prisma.locationHistory.create({
                data: {
                    userId,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    accuracy: data.accuracy,
                    timestamp: data.timestamp || new Date(),
                    placeName: data.placeName,
                    placeType: data.placeType,
                },
            });

            logger.info(`Location recorded for user ${userId}: ${data.latitude}, ${data.longitude}`);
            return location;
        } catch (error) {
            logger.error('Error recording location:', error);
            throw error;
        }
    }

    /**
     * Get location history for a user
     */
    async getLocationHistory(userId: string, startDate?: Date, endDate?: Date, limit: number = 100) {
        const where: any = { userId };

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = startDate;
            if (endDate) where.timestamp.lte = endDate;
        }

        return await prisma.locationHistory.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }

    /**
     * Get significant locations (places where user spent time)
     */
    async getSignificantLocations(userId: string) {
        return await prisma.locationHistory.findMany({
            where: {
                userId,
                isSignificant: true,
            },
            orderBy: { timestamp: 'desc' },
        });
    }

    /**
     * Detect if a location is significant based on dwell time
     */
    async detectSignificantLocation(userId: string, locationId: string) {
        try {
            const location = await prisma.locationHistory.findUnique({
                where: { id: locationId },
            });

            if (!location) {
                return false;
            }

            // Check if dwell time exceeds threshold (30 minutes)
            const DWELL_TIME_THRESHOLD = 30;
            if (location.dwellTime && location.dwellTime >= DWELL_TIME_THRESHOLD) {
                await prisma.locationHistory.update({
                    where: { id: locationId },
                    data: { isSignificant: true },
                });
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error detecting significant location:', error);
            return false;
        }
    }

    /**
     * Identify place using coordinates (placeholder for Google Places API)
     */
    async identifyPlace(latitude: number, longitude: number): Promise<{ name: string; type: string } | null> {
        try {
            // TODO: Implement Google Places API integration
            // For now, return null
            // In production:
            // const response = await fetch(
            //   `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=50&key=${process.env.GOOGLE_MAPS_API_KEY}`
            // );
            // const data = await response.json();
            // return { name: data.results[0].name, type: data.results[0].types[0] };

            logger.info(`Place identification requested for ${latitude}, ${longitude}`);
            return null;
        } catch (error) {
            logger.error('Error identifying place:', error);
            return null;
        }
    }

    /**
     * Check if location is within a privacy zone
     */
    async isInPrivacyZone(userId: string, latitude: number, longitude: number): Promise<boolean> {
        try {
            const privacyZones = await prisma.privacyZone.findMany({
                where: {
                    userId,
                    trackingDisabled: true,
                },
            });

            for (const zone of privacyZones) {
                const distance = this.calculateDistance(
                    latitude,
                    longitude,
                    zone.latitude,
                    zone.longitude
                );

                if (distance <= zone.radius) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            logger.error('Error checking privacy zone:', error);
            return false;
        }
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
            Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}

export const locationService = new LocationService();
