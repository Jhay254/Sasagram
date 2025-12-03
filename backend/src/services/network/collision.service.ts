import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class CollisionService {
    /**
     * Detect temporal and spatial overlaps between two users based on their media
     */
    async detectOverlaps(userAId: string, userBId: string): Promise<any[]> {
        const userAMedia = await prisma.media.findMany({
            where: { userId: userAId, takenAt: { not: null } },
            select: { id: true, takenAt: true, latitude: true, longitude: true }
        });

        const userBMedia = await prisma.media.findMany({
            where: { userId: userBId, takenAt: { not: null } },
            select: { id: true, takenAt: true, latitude: true, longitude: true }
        });

        const overlaps = [];

        for (const mediaA of userAMedia) {
            for (const mediaB of userBMedia) {
                if (!mediaA.takenAt || !mediaB.takenAt) continue;

                // Temporal: within 24 hours
                const timeDiff = Math.abs(mediaA.takenAt.getTime() - mediaB.takenAt.getTime());
                const isSameDay = timeDiff < 24 * 60 * 60 * 1000;

                // Spatial: within ~100 meters (0.001 degrees is roughly 111m)
                let isNearby = false;
                if (mediaA.latitude && mediaA.longitude && mediaB.latitude && mediaB.longitude) {
                    const latDiff = Math.abs(mediaA.latitude - mediaB.latitude);
                    const lonDiff = Math.abs(mediaA.longitude - mediaB.longitude);
                    if (latDiff < 0.001 && lonDiff < 0.001) {
                        isNearby = true;
                    }
                }

                if (isSameDay && isNearby) {
                    overlaps.push({
                        type: 'spatial_temporal',
                        mediaA,
                        mediaB,
                        confidence: 0.9,
                        timestamp: mediaA.takenAt
                    });
                } else if (isSameDay) {
                    overlaps.push({
                        type: 'temporal',
                        mediaA,
                        mediaB,
                        confidence: 0.4,
                        timestamp: mediaA.takenAt
                    });
                }
            }
        }

        return overlaps;
    }

    /**
     * Process a new media item to detect collisions with friends
     */
    async processNewMedia(mediaId: string): Promise<void> {
        const media = await prisma.media.findUnique({
            where: { id: mediaId },
            include: { user: true }
        });

        if (!media || !media.takenAt) return;

        // Find connections to limit search space
        const connections = await prisma.connection.findMany({
            where: {
                OR: [{ userAId: media.userId }, { userBId: media.userId }]
            }
        });

        const friendIds = connections.map(c => c.userAId === media.userId ? c.userBId : c.userAId);

        if (friendIds.length === 0) return;

        // Find media from friends within 24 hours
        const potentialMatches = await prisma.media.findMany({
            where: {
                userId: { in: friendIds },
                takenAt: {
                    gte: new Date(media.takenAt.getTime() - 24 * 60 * 60 * 1000),
                    lte: new Date(media.takenAt.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        for (const match of potentialMatches) {
            // Check spatial if available
            let isSpatialMatch = false;
            if (media.latitude && media.longitude && match.latitude && match.longitude) {
                const latDiff = Math.abs(media.latitude - match.latitude);
                const lonDiff = Math.abs(media.longitude - match.longitude);
                if (latDiff < 0.001 && lonDiff < 0.001) {
                    isSpatialMatch = true;
                }
            }

            if (isSpatialMatch) {
                await this.createCollision(
                    [media.userId, match.userId],
                    media.takenAt,
                    'spatial',
                    0.9,
                    `Shared memory at ${media.latitude}, ${media.longitude}`
                );
            }
        }
    }

    private async createCollision(userIds: string[], timestamp: Date, type: string, confidence: number, location?: string) {
        // Check if similar collision already exists to avoid duplicates
        const existing = await prisma.memoryCollision.findFirst({
            where: {
                timestamp: timestamp,
                users: JSON.stringify(userIds)
            }
        });

        if (existing) return;

        await prisma.memoryCollision.create({
            data: {
                title: `Shared Memory on ${timestamp.toDateString()}`,
                timestamp,
                users: JSON.stringify(userIds),
                confidence,
                detectedBy: type,
                location,
                verified: false
            }
        });

        logger.info(`Created memory collision for users ${userIds.join(', ')}`);
    }
}

export const collisionService = new CollisionService();
