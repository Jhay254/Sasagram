import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class ConnectionService {
    /**
     * Calculate connection strength between two users
     */
    async calculateStrength(userAId: string, userBId: string): Promise<number> {
        // Count shared events (collisions)
        const collisions = await prisma.memoryCollision.findMany({
            where: {
                users: {
                    contains: userAId,
                },
            },
        });

        // Filter for collisions that include both users
        const sharedCollisions = collisions.filter(c => {
            const users = JSON.parse(c.users);
            return users.includes(userAId) && users.includes(userBId);
        });

        // Count mutual tags
        const mutualTags = await prisma.eventTag.count({
            where: {
                OR: [
                    { taggerId: userAId, taggedUserId: userBId },
                    { taggerId: userBId, taggedUserId: userAId },
                ],
                status: 'accepted',
            },
        });

        // Calculate strength score (0-100)
        const sharedEventsScore = Math.min(sharedCollisions.length * 10, 50);
        const mutualTagsScore = Math.min(mutualTags * 5, 30);
        const baseScore = 20; // Base for confirmed connection

        return Math.min(baseScore + sharedEventsScore + mutualTagsScore, 100);
    }

    /**
     * Create or update connection between users
     */
    async createOrUpdateConnection(
        userAId: string,
        userBId: string,
        relationshipType?: string
    ): Promise<any> {
        // Ensure userA < userB alphabetically for consistency
        const [smallerId, largerId] = [userAId, userBId].sort();

        const strength = await this.calculateStrength(smallerId, largerId);

        const connection = await prisma.connection.upsert({
            where: {
                userAId_userBId: { userAId: smallerId, userBId: largerId },
            },
            update: {
                strengthScore: strength,
                lastInteraction: new Date(),
                updatedAt: new Date(),
            },
            create: {
                userAId: smallerId,
                userBId: largerId,
                strengthScore: strength,
                relationshipType,
                lastInteraction: new Date(),
            },
        });

        return connection;
    }

    /**
     * Get user's memory graph
     */
    async getMemoryGraph(userId: string): Promise<any> {
        const connections = await prisma.connection.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
            },
            include: {
                userA: { select: { id: true, name: true, email: true } },
                userB: { select: { id: true, name: true, email: true } },
            },
        });

        // Format for graph visualization
        const nodes = new Map();
        const edges: any[] = [];

        connections.forEach(conn => {
            // Add nodes
            if (!nodes.has(conn.userA.id)) {
                nodes.set(conn.userA.id, {
                    id: conn.userA.id,
                    name: conn.userA.name,
                    email: conn.userA.email,
                });
            }
            if (!nodes.has(conn.userB.id)) {
                nodes.set(conn.userB.id, {
                    id: conn.userB.id,
                    name: conn.userB.name,
                    email: conn.userB.email,
                });
            }

            // Add edge
            edges.push({
                source: conn.userA.id,
                target: conn.userB.id,
                strength: conn.strengthScore,
                relationshipType: conn.relationshipType,
                sharedEvents: conn.sharedEvents,
            });
        });

        return {
            nodes: Array.from(nodes.values()),
            edges,
            totalConnections: connections.length,
        };
    }

    /**
     * Get relationship timeline between two users
     */
    async getRelationshipTimeline(userAId: string, userBId: string): Promise<any> {
        const [smallerId, largerId] = [userAId, userBId].sort();

        const connection = await prisma.connection.findUnique({
            where: {
                userAId_userBId: { userAId: smallerId, userBId: largerId },
            },
        });

        if (!connection) {
            return { events: [], strength: 0 };
        }

        // Get all shared collisions
        const allCollisions = await prisma.memoryCollision.findMany({
            orderBy: { timestamp: 'asc' },
        });

        const sharedCollisions = allCollisions.filter(c => {
            const users = JSON.parse(c.users);
            return users.includes(userAId) && users.includes(userBId);
        });

        return {
            connection,
            sharedEvents: sharedCollisions,
            timeline: connection.timeline ? JSON.parse(connection.timeline) : [],
        };
    }
}

export const connectionService = new ConnectionService();
