"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeduplicationService = void 0;
const client_1 = require("@prisma/client");
const media_service_1 = require("./media.service");
const prisma = new client_1.PrismaClient();
const mediaService = new media_service_1.MediaService();
class DeduplicationService {
    /**
     * Find and remove duplicate media entries
     */
    async deduplicateMedia(userId) {
        // Find all media with duplicate hashes
        const duplicates = await prisma.media.groupBy({
            by: ['fileHash'],
            where: { userId },
            having: {
                fileHash: {
                    _count: {
                        gt: 1,
                    },
                },
            },
        });
        let removed = 0;
        for (const dup of duplicates) {
            // Get all entries with this hash
            const entries = await prisma.media.findMany({
                where: {
                    userId,
                    fileHash: dup.fileHash,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            // Keep the first one, delete the rest
            const toDelete = entries.slice(1);
            for (const entry of toDelete) {
                await prisma.media.delete({
                    where: { id: entry.id },
                });
                removed++;
            }
        }
        console.log(`Removed ${removed} duplicate media entries for user ${userId}`);
        return removed;
    }
    /**
     * Find duplicate content entries (same platformId)
     */
    async deduplicateContent(userId) {
        const duplicates = await prisma.content.groupBy({
            by: ['provider', 'platformId'],
            where: { userId },
            having: {
                platformId: {
                    _count: {
                        gt: 1,
                    },
                },
            },
        });
        let removed = 0;
        for (const dup of duplicates) {
            const entries = await prisma.content.findMany({
                where: {
                    userId,
                    provider: dup.provider,
                    platformId: dup.platformId,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            const toDelete = entries.slice(1);
            for (const entry of toDelete) {
                await prisma.content.delete({
                    where: { id: entry.id },
                });
                removed++;
            }
        }
        console.log(`Removed ${removed} duplicate content entries for user ${userId}`);
        return removed;
    }
    /**
     * Run full deduplication for a user
     */
    async deduplicateAll(userId) {
        const mediaRemoved = await this.deduplicateMedia(userId);
        const contentRemoved = await this.deduplicateContent(userId);
        return {
            mediaRemoved,
            contentRemoved,
            total: mediaRemoved + contentRemoved,
        };
    }
}
exports.DeduplicationService = DeduplicationService;
