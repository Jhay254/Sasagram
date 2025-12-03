"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.livingFeedService = exports.LivingFeedService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
class LivingFeedService {
    /**
     * Create a new feed entry
     */
    async createEntry(userId, data) {
        // Find active chapter
        const activeChapter = await prisma.livingChapter.findFirst({
            where: {
                userId,
                status: 'active',
            },
        });
        if (!activeChapter) {
            throw new Error('No active chapter found. Please start a new chapter first.');
        }
        const entry = await prisma.livingFeedEntry.create({
            data: {
                userId,
                chapterId: activeChapter.id,
                content: data.content,
                mood: data.mood,
                location: data.location,
                mediaUrls: JSON.stringify(data.mediaUrls || []),
                isPublic: data.isPublic ?? true,
            },
        });
        logger_1.default.info(`Created feed entry for user ${userId}`, { entryId: entry.id });
        return {
            ...entry,
            mediaUrls: JSON.parse(entry.mediaUrls),
        };
    }
    /**
     * Get aggregated feed for a user
     */
    async getFeed(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        // Get entries from user's own chapters and potentially followed users (future)
        // For now, just return user's own entries
        const entries = await prisma.livingFeedEntry.findMany({
            where: {
                userId,
            },
            orderBy: {
                timestamp: 'desc',
            },
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
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
        const total = await prisma.livingFeedEntry.count({
            where: { userId },
        });
        const parsedEntries = entries.map(entry => ({
            ...entry,
            mediaUrls: JSON.parse(entry.mediaUrls),
        }));
        return {
            entries: parsedEntries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get entries for a specific chapter
     */
    async getChapterFeed(chapterId) {
        const entries = await prisma.livingFeedEntry.findMany({
            where: {
                chapterId,
            },
            orderBy: {
                timestamp: 'asc', // Chronological order for chapter view
            },
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
exports.LivingFeedService = LivingFeedService;
exports.livingFeedService = new LivingFeedService();
