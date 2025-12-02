"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedService = exports.FeedService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const chapter_service_1 = require("./chapter.service");
const prisma = new client_1.PrismaClient();
class FeedService {
    /**
     * Create a new feed entry
     */
    async createEntry(userId, data) {
        // Find active chapter to link to
        const activeChapter = await chapter_service_1.chapterService.getActiveChapter(userId);
        const entry = await prisma.livingFeedEntry.create({
            data: {
                userId,
                content: data.content,
                mood: data.mood,
                location: data.location,
                mediaUrls: JSON.stringify(data.mediaUrls || []),
                isPublic: data.isPublic ?? true,
                chapterId: activeChapter?.id,
            },
        });
        logger_1.default.info(`Created feed entry for user ${userId}`, { entryId: entry.id });
        return entry;
    }
    /**
     * Get aggregated feed for a user (own posts + connections)
     */
    async getFeed(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        // Get user's connections
        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId },
                ],
            },
        });
        const connectionIds = connections.map(c => c.userAId === userId ? c.userBId : c.userAId);
        // Include user's own ID
        const feedUserIds = [userId, ...connectionIds];
        const entries = await prisma.livingFeedEntry.findMany({
            where: {
                userId: { in: feedUserIds },
                OR: [
                    { isPublic: true },
                    { userId }, // Always show own private posts
                ],
            },
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true, // In real app, use avatarUrl
                    },
                },
                chapter: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        // Parse mediaUrls JSON
        return entries.map(entry => ({
            ...entry,
            mediaUrls: JSON.parse(entry.mediaUrls),
        }));
    }
    /**
     * Get entries for a specific chapter
     */
    async getChapterFeed(chapterId) {
        const entries = await prisma.livingFeedEntry.findMany({
            where: { chapterId },
            orderBy: { timestamp: 'asc' }, // Chronological for chapters
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        return entries.map(entry => ({
            ...entry,
            mediaUrls: JSON.parse(entry.mediaUrls),
        }));
    }
}
exports.FeedService = FeedService;
exports.feedService = new FeedService();
