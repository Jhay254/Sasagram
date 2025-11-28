import prisma from '../db/prisma';
import { ConnectionType } from '@prisma/client';

interface SharedEventCandidate {
    eventType: ConnectionType;
    eventDate: Date;
    duration?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    userASourceType?: string;
    userASourceId?: string;
    userBSourceType?: string;
    userBSourceId?: string;
    confidence: number;
    metadata?: any;
}

export class MemoryGraphService {
    // Constants for detection thresholds
    private static readonly TEMPORAL_WINDOW_HOURS = 4;
    private static readonly SPATIAL_RADIUS_METERS = 100;
    private static readonly MIN_CONFIDENCE = 0.3;

    /**
     * Main collision detection - finds shared experiences between two users
     */
    static async detectCollisions(userAId: string, userBId: string): Promise<void> {
        // Check if both users have collision detection enabled
        const users = await prisma.user.findMany({
            where: { id: { in: [userAId, userBId] } },
            select: { id: true, collisionDetectionEnabled: true },
        });

        if (users.some(u => !u.collisionDetectionEnabled)) {
            return; // Respect privacy settings
        }

        // Fetch all data for both users
        const [userAData, userBData] = await Promise.all([
            this.getUserData(userAId),
            this.getUserData(userBId),
        ]);

        // Run collision detection algorithms
        const candidates: SharedEventCandidate[] = [];

        // 1. Temporal overlaps
        candidates.push(...await this.findTemporalOverlaps(userAData, userBData));

        // 2. Spatial overlaps
        candidates.push(...await this.findSpatialOverlaps(userAData, userBData));

        // 3. Mutual mentions
        candidates.push(...await this.findMutualMentions(userAData, userBData));

        // Filter by minimum confidence
        const validCandidates = candidates.filter(c => c.confidence >= this.MIN_CONFIDENCE);

        if (validCandidates.length === 0) {
            return; // No shared events found
        }

        // Create or update connection
        await this.createOrUpdateConnection(userAId, userBId, validCandidates);
    }

    /**
     * Get all user data for collision detection
     */
    private static async getUserData(userId: string) {
        return await prisma.user.findUnique({
            where: { id: userId },
            include: {
                dataSources: {
                    include: {
                        socialPosts: true,
                        mediaItems: true,
                        emailMetadata: true,
                    },
                },
            },
        });
    }

    /**
     * Find temporal overlaps - posts at similar times
     */
    private static async findTemporalOverlaps(userA: any, userB: any): Promise<SharedEventCandidate[]> {
        const overlaps: SharedEventCandidate[] = [];
        const WINDOW_MS = this.TEMPORAL_WINDOW_HOURS * 60 * 60 * 1000;

        // Get all posts from both users
        const userAPosts = userA?.dataSources.flatMap((ds: any) => ds.socialPosts || []) || [];
        const userBPosts = userB?.dataSources.flatMap((ds: any) => ds.socialPosts || []) || [];

        for (const postA of userAPosts) {
            for (const postB of userBPosts) {
                const timeDiff = Math.abs(
                    new Date(postA.createdAt).getTime() - new Date(postB.createdAt).getTime()
                );

                if (timeDiff <= WINDOW_MS) {
                    const confidence = 1 - (timeDiff / WINDOW_MS); // Closer = higher confidence

                    overlaps.push({
                        eventType: ConnectionType.TEMPORAL_OVERLAP,
                        eventDate: new Date(postA.createdAt),
                        duration: Math.round(timeDiff / (1000 * 60 * 60)), // Hours
                        userASourceType: postA.provider,
                        userASourceId: postA.id,
                        userBSourceType: postB.provider,
                        userBSourceId: postB.id,
                        confidence,
                        metadata: {
                            userAContent: postA.content?.substring(0, 200),
                            userBContent: postB.content?.substring(0, 200),
                        },
                    });
                }
            }
        }

        return overlaps;
    }

    /**
     * Find spatial overlaps - same location at similar times
     */
    private static async findSpatialOverlaps(userA: any, userB: any): Promise<SharedEventCandidate[]> {
        const overlaps: SharedEventCandidate[] = [];

        const userAMedia = userA?.dataSources.flatMap((ds: any) => ds.mediaItems || []) || [];
        const userBMedia = userB?.dataSources.flatMap((ds: any) => ds.mediaItems || []) || [];

        for (const mediaA of userAMedia) {
            if (!mediaA.latitude || !mediaA.longitude) continue;

            for (const mediaB of userBMedia) {
                if (!mediaB.latitude || !mediaB.longitude) continue;

                const distance = this.haversineDistance(
                    mediaA.latitude,
                    mediaA.longitude,
                    mediaB.latitude,
                    mediaB.longitude
                );

                if (distance <= this.SPATIAL_RADIUS_METERS) {
                    const confidence = 1 - (distance / this.SPATIAL_RADIUS_METERS);

                    overlaps.push({
                        eventType: ConnectionType.SPATIAL_OVERLAP,
                        eventDate: new Date(mediaA.createdAt),
                        location: mediaA.location || mediaB.location,
                        latitude: mediaA.latitude,
                        longitude: mediaA.longitude,
                        userASourceType: 'MEDIA',
                        userASourceId: mediaA.id,
                        userBSourceType: 'MEDIA',
                        userBSourceId: mediaB.id,
                        confidence,
                        metadata: {
                            distance,
                            userAUrl: mediaA.url,
                            userBUrl: mediaB.url,
                        },
                    });
                }
            }
        }

        return overlaps;
    }

    /**
     * Find mutual mentions - tagged together
     */
    private static async findMutualMentions(userA: any, userB: any): Promise<SharedEventCandidate[]> {
        const mentions: SharedEventCandidate[] = [];

        const userAPosts = userA?.dataSources.flatMap((ds: any) => ds.socialPosts || []) || [];
        const userBPosts = userB?.dataSources.flatMap((ds: any) => ds.socialPosts || []) || [];

        // Check if user A mentions user B
        for (const post of userAPosts) {
            const content = post.content?.toLowerCase() || '';
            const mentionsB = content.includes(userB.email.toLowerCase()) ||
                content.includes(`@${userB.displayName?.toLowerCase()}`);

            if (mentionsB) {
                mentions.push({
                    eventType: ConnectionType.MUTUAL_MENTION,
                    eventDate: new Date(post.createdAt),
                    userASourceType: post.provider,
                    userASourceId: post.id,
                    confidence: 0.8,
                    metadata: { content: post.content?.substring(0, 200) },
                });
            }
        }

        // Check if user B mentions user A (reciprocal higher confidence)
        for (const post of userBPosts) {
            const content = post.content?.toLowerCase() || '';
            const mentionsA = content.includes(userA.email.toLowerCase()) ||
                content.includes(`@${userA.displayName?.toLowerCase()}`);

            if (mentionsA) {
                mentions.push({
                    eventType: ConnectionType.MUTUAL_MENTION,
                    eventDate: new Date(post.createdAt),
                    userBSourceType: post.provider,
                    userBSourceId: post.id,
                    confidence: 0.9,
                    metadata: { content: post.content?.substring(0, 200) },
                });
            }
        }

        return mentions;
    }

    /**
     * Calculate distance between two GPS coordinates (Haversine formula)
     */
    private static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Create or update user connection based on shared events
     */
    private static async createOrUpdateConnection(
        userAId: string,
        userBId: string,
        events: SharedEventCandidate[]
    ): Promise<void> {
        // Ensure consistent ordering (A < B)
        const [orderedAId, orderedBId] = [userAId, userBId].sort();

        // Check if connection exists
        let connection = await prisma.userConnection.findUnique({
            where: {
                userAId_userBId: {
                    userAId: orderedAId,
                    userBId: orderedBId,
                },
            },
        });

        // Extract unique connection types
        const connectionTypes = [...new Set(events.map(e => e.eventType))];

        // Find first and last event
        const sortedEvents = events.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];

        if (!connection) {
            // Create new connection
            connection = await prisma.userConnection.create({
                data: {
                    userAId: orderedAId,
                    userBId: orderedBId,
                    connectionTypes,
                    sharedEventCount: events.length,
                    firstSharedEvent: firstEvent.eventDate,
                    lastSharedEvent: lastEvent.eventDate,
                    strength: 0, // Will calculate next
                },
            });
        } else {
            // Update existing connection
            await prisma.userConnection.update({
                where: { id: connection.id },
                data: {
                    connectionTypes: [...new Set([...connection.connectionTypes, ...connectionTypes])],
                    sharedEventCount: { increment: events.length },
                    lastSharedEvent: lastEvent.eventDate,
                },
            });
        }

        // Create shared event records
        await prisma.sharedEvent.createMany({
            data: events.map(event => ({
                connectionId: connection!.id,
                eventType: event.eventType,
                eventDate: event.eventDate,
                duration: event.duration,
                location: event.location,
                latitude: event.latitude,
                longitude: event.longitude,
                userASourceType: event.userASourceType,
                userASourceId: event.userASourceId,
                userBSourceType: event.userBSourceType,
                userBSourceId: event.userBSourceId,
                confidence: event.confidence,
                metadata: event.metadata,
            })),
        });

        // Calculate connection strength
        await this.calculateConnectionStrength(connection.id);

        // Create memory collision notification
        await this.createMemoryCollision(orderedAId, orderedBId, connection.id);
    }

    /**
     * Calculate connection strength score (0-100)
     */
    static async calculateConnectionStrength(connectionId: string): Promise<number> {
        const connection = await prisma.userConnection.findUnique({
            where: { id: connectionId },
            include: { sharedEvents: true },
        });

        if (!connection) return 0;

        const events = connection.sharedEvents;
        if (events.length === 0) return 0;

        // 1. Frequency score (0-40 points) - based on number of shared events
        const frequencyScore = Math.min(events.length * 4, 40);

        // 2. Recency score (0-30 points) - based on how recent the last event was
        const now = new Date();
        const lastEventDate = connection.lastSharedEvent || new Date(0);
        const daysSinceLastEvent = (now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(30 - daysSinceLastEvent / 10, 0);

        // 3. Diversity score (0-20 points) - based on variety of event types
        const uniqueTypes = new Set(events.map(e => e.eventType)).size;
        const diversityScore = uniqueTypes * 6.67; // Max 3 types = 20 points

        // 4. Confidence score (0-10 points) - average confidence of events
        const avgConfidence = events.reduce((sum, e) => sum + e.confidence, 0) / events.length;
        const confidenceScore = avgConfidence * 10;

        const totalStrength = frequencyScore + recencyScore + diversityScore + confidenceScore;

        // Update connection
        await prisma.userConnection.update({
            where: { id: connectionId },
            data: { strength: Math.round(totalStrength * 100) / 100 }, // Round to 2 decimals
        });

        return totalStrength;
    }

    /**
     * Create memory collision notification
     */
    private static async createMemoryCollision(
        userAId: string,
        userBId: string,
        connectionId: string
    ): Promise<void> {
        // Check if collision already exists
        const existing = await prisma.memoryCollision.findFirst({
            where: {
                initiatorId: userAId,
                targetId: userBId,
                connectionId,
            },
        });

        if (existing) return;

        // Create collision for both users
        await prisma.memoryCollision.createMany({
            data: [
                {
                    initiatorId: userAId,
                    targetId: userBId,
                    connectionId,
                    eventSummary: 'New shared experiences detected',
                },
                {
                    initiatorId: userBId,
                    targetId: userAId,
                    connectionId,
                    eventSummary: 'New shared experiences detected',
                },
            ],
        });
    }

    /**
     * Get connection graph for a user
     */
    static async getConnectionGraph(userId: string, depth: number = 1) {
        const connections = await prisma.userConnection.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
                hidden: false,
            },
            include: {
                userA: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                userB: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { strength: 'desc' },
        });

        // Format for graph visualization
        const nodes = new Map();
        const edges = [];

        // Add central user node
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
            },
        });

        nodes.set(userId, { ...user, type: 'central' });

        // Add connection nodes and edges
        for (const conn of connections) {
            const otherUser = conn.userAId === userId ? conn.userB : conn.userA;

            if (!nodes.has(otherUser.id)) {
                nodes.set(otherUser.id, { ...otherUser, type: 'connection' });
            }

            edges.push({
                source: userId,
                target: otherUser.id,
                strength: conn.strength,
                sharedEventCount: conn.sharedEventCount,
            });
        }

        return {
            nodes: Array.from(nodes.values()),
            edges,
        };
    }

    /**
     * Get shared events between two users
     */
    static async getSharedEvents(userAId: string, userBId: string) {
        const [orderedAId, orderedBId] = [userAId, userBId].sort();

        const connection = await prisma.userConnection.findUnique({
            where: {
                userAId_userBId: {
                    userAId: orderedAId,
                    userBId: orderedBId,
                },
            },
            include: {
                sharedEvents: {
                    orderBy: { eventDate: 'desc' },
                },
            },
        });

        return connection?.sharedEvents || [];
    }
}
