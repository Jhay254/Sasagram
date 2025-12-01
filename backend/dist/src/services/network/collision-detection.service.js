"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collisionDetectionService = exports.CollisionDetectionService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
class CollisionDetectionService {
    /**
     * Detect temporal overlaps (same date/time)
     */
    async detectTemporalCollisions(userId) {
        const userContent = await prisma.content.findMany({
            where: { userId },
            select: { timestamp: true, text: true, id: true },
        });
        const collisions = [];
        for (const content of userContent) {
            // Find other users' content within ±4 hours
            const timeWindow = 4 * 60 * 60 * 1000; // 4 hours in ms
            const startTime = new Date(content.timestamp.getTime() - timeWindow);
            const endTime = new Date(content.timestamp.getTime() + timeWindow);
            const overlappingContent = await prisma.content.findMany({
                where: {
                    userId: { not: userId },
                    timestamp: {
                        gte: startTime,
                        lte: endTime,
                    },
                },
                include: { user: true },
            });
            if (overlappingContent.length > 0) {
                collisions.push({
                    type: 'temporal',
                    users: [userId, ...overlappingContent.map(c => c.userId)],
                    confidence: 75,
                    eventData: {
                        timestamp: content.timestamp,
                        relatedContent: content.id,
                    },
                });
            }
        }
        return collisions;
    }
    /**
     * Detect spatial overlaps (same location)
     */
    async detectSpatialCollisions(userId) {
        const userMedia = await prisma.media.findMany({
            where: {
                userId,
                latitude: { not: null },
                longitude: { not: null },
            },
            select: { latitude: true, longitude: true, takenAt: true, id: true },
        });
        const collisions = [];
        for (const media of userMedia) {
            if (!media.latitude || !media.longitude)
                continue;
            // Find media within 50m radius (approx 0.0005 degrees)
            const latRange = 0.0005;
            const lonRange = 0.0005;
            const nearbyMedia = await prisma.media.findMany({
                where: {
                    userId: { not: userId },
                    latitude: {
                        gte: media.latitude - latRange,
                        lte: media.latitude + latRange,
                    },
                    longitude: {
                        gte: media.longitude - lonRange,
                        lte: media.longitude + lonRange,
                    },
                },
                include: { user: true },
            });
            if (nearbyMedia.length > 0) {
                collisions.push({
                    type: 'spatial',
                    users: [userId, ...nearbyMedia.map(m => m.userId)],
                    confidence: 85,
                    eventData: {
                        location: { lat: media.latitude, lon: media.longitude },
                        timestamp: media.takenAt,
                    },
                });
            }
        }
        return collisions;
    }
    /**
     * Detect mutual mentions
     */
    async detectMutualMentions(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.name)
            return [];
        // Find content that mentions user's name
        const mentions = await prisma.content.findMany({
            where: {
                userId: { not: userId },
                text: {
                    contains: user.name,
                },
            },
            include: { user: true },
        });
        return mentions.map(mention => ({
            type: 'mutual_mention',
            users: [userId, mention.userId],
            confidence: 60,
            eventData: {
                contentId: mention.id,
                text: mention.text,
                timestamp: mention.timestamp,
            },
        }));
    }
    /**
     * Main detection runner
     */
    async detectAllCollisions(userId) {
        logger_1.default.info(`Running collision detection for user ${userId}`);
        const [temporal, spatial, mentions] = await Promise.all([
            this.detectTemporalCollisions(userId),
            this.detectSpatialCollisions(userId),
            this.detectMutualMentions(userId),
        ]);
        const allCollisions = [...temporal, ...spatial, ...mentions];
        // Store collisions in database
        for (const collision of allCollisions) {
            await prisma.memoryCollision.create({
                data: {
                    title: `Potential shared memory`,
                    timestamp: collision.eventData.timestamp || new Date(),
                    location: collision.eventData.location
                        ? JSON.stringify(collision.eventData.location)
                        : null,
                    users: JSON.stringify(collision.users),
                    confidence: collision.confidence,
                    detectedBy: collision.type,
                    verified: false,
                },
            });
        }
        logger_1.default.info(`Detected ${allCollisions.length} collisions for user ${userId}`);
    }
}
exports.CollisionDetectionService = CollisionDetectionService;
exports.collisionDetectionService = new CollisionDetectionService();
