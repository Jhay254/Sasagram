import prisma from '../db/prisma';

export class LocationService {
    /**
     * Save location record
     */
    static async saveLocation(
        userId: string,
        latitude: number,
        longitude: number,
        accuracy?: number,
        metadata?: any
    ) {
        return await prisma.locationHistory.create({
            data: {
                userId,
                latitude,
                longitude,
                accuracy,
                metadata,
            },
        });
    }

    /**
     * Get user's location history
     */
    static async getLocationHistory(
        userId: string,
        startDate?: Date,
        endDate?: Date,
        limit: number = 100
    ) {
        const where: any = { userId };

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        return await prisma.locationHistory.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get location privacy settings
     */
    static async getLocationPrivacy(userId: string) {
        let privacy = await prisma.locationPrivacy.findUnique({
            where: { userId },
        });

        if (!privacy) {
            // Create default settings
            privacy = await prisma.locationPrivacy.create({
                data: {
                    userId,
                    trackingEnabled: false,
                    backgroundTracking: false,
                    shareWithOthers: false,
                    precisionLevel: 'CITY', // EXACT, CITY, COUNTRY
                },
            });
        }

        return privacy;
    }

    /**
     * Update location privacy settings
     */
    static async updateLocationPrivacy(userId: string, settings: any) {
        return await prisma.locationPrivacy.upsert({
            where: { userId },
            update: settings,
            create: {
                userId,
                ...settings,
            },
        });
    }

    /**
     * Check for nearby memories (geofencing)
     */
    static async checkNearbyMemories(
        userId: string,
        latitude: number,
        longitude: number,
        radiusKm: number = 1
    ) {
        // Get user's memories with locations
        const memories = await prisma.memory.findMany({
            where: {
                userId,
                latitude: { not: null },
                longitude: { not: null },
            },
            select: {
                id: true,
                title: true,
                description: true,
                latitude: true,
                longitude: true,
                date: true,
            },
        });

        // Calculate distance and filter
        const nearbyMemories = memories.filter(memory => {
            const distance = this.calculateDistance(
                latitude,
                longitude,
                memory.latitude!,
                memory.longitude!
            );
            return distance <= radiusKm;
        });

        return nearbyMemories;
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private static calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) *
            Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Delete location history
     */
    static async deleteLocationHistory(userId: string, beforeDate?: Date) {
        const where: any = { userId };
        if (beforeDate) {
            where.createdAt = { lt: beforeDate };
        }

        await prisma.locationHistory.deleteMany({ where });
    }
}
