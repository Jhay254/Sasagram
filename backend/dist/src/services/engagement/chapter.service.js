"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterService = exports.ChapterService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
class ChapterService {
    /**
     * Create or start a new chapter
     */
    async createChapter(userId, data) {
        // Check if there's already an active chapter
        const activeChapter = await this.getActiveChapter(userId);
        if (activeChapter) {
            // Automatically complete the previous chapter if a new one starts
            await this.completeChapter(activeChapter.id, 'new_chapter_started');
        }
        const chapter = await prisma.livingChapter.create({
            data: {
                userId,
                title: data.title,
                content: data.content,
                startDate: data.startDate,
                endDate: data.endDate,
                status: 'active',
            },
        });
        logger_1.default.info(`Created new chapter for user ${userId}`, { chapterId: chapter.id });
        return chapter;
    }
    /**
     * Complete a chapter
     */
    async completeChapter(chapterId, trigger) {
        const chapter = await prisma.livingChapter.update({
            where: { id: chapterId },
            data: {
                status: 'completed',
                endDate: new Date(),
                completionTrigger: trigger,
            },
        });
        logger_1.default.info(`Completed chapter ${chapterId}`, { trigger });
        return chapter;
    }
    /**
     * Get user's currently active chapter
     */
    async getActiveChapter(userId) {
        return prisma.livingChapter.findFirst({
            where: {
                userId,
                status: 'active',
            },
            orderBy: { startDate: 'desc' },
        });
    }
    /**
     * Get all chapters for a user
     */
    async getUserChapters(userId) {
        return prisma.livingChapter.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
            include: {
                _count: {
                    select: { entries: true },
                },
            },
        });
    }
    /**
     * Detect potential chapter completion triggers (AI placeholder)
     */
    async detectChapterCompletion(userId) {
        // Placeholder for AI logic
        // In a real implementation, this would analyze recent feed entries,
        // location changes, or job updates to suggest closing a chapter.
        // Example logic: Check if active chapter is > 1 year old
        const activeChapter = await this.getActiveChapter(userId);
        if (activeChapter) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            if (activeChapter.startDate < oneYearAgo) {
                return {
                    detected: true,
                    reason: 'Chapter duration exceeds 1 year',
                    confidence: 70,
                };
            }
        }
        return { detected: false };
    }
    /**
     * Get analytics for a specific chapter
     */
    async getChapterAnalytics(chapterId) {
        // Get total entries
        const totalEntries = await prisma.livingFeedEntry.count({
            where: { chapterId },
        });
        // Get entries by day (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentEntries = await prisma.livingFeedEntry.findMany({
            where: {
                chapterId,
                createdAt: { gte: sevenDaysAgo },
            },
            select: { createdAt: true },
        });
        const entriesByDayMap = new Map();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = days[d.getDay()];
            entriesByDayMap.set(dayName, 0);
        }
        recentEntries.forEach(entry => {
            const dayName = days[entry.createdAt.getDay()];
            entriesByDayMap.set(dayName, (entriesByDayMap.get(dayName) || 0) + 1);
        });
        const entriesByDay = Array.from(entriesByDayMap.entries()).map(([day, count]) => ({
            day,
            count,
        }));
        // Get mood distribution
        const moodData = await prisma.livingFeedEntry.groupBy({
            by: ['mood'],
            where: { chapterId },
            _count: { mood: true },
        });
        const moodDistribution = moodData.map(item => ({
            mood: item.mood,
            count: item._count.mood,
        })).sort((a, b) => b.count - a.count);
        return {
            totalEntries,
            subscriberCount: 0, // Placeholder for Phase 2.1
            viewCount: totalEntries * 15, // Mock view count
            entriesByDay,
            moodDistribution,
        };
    }
}
exports.ChapterService = ChapterService;
exports.chapterService = new ChapterService();
