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
}
exports.ChapterService = ChapterService;
exports.chapterService = new ChapterService();
