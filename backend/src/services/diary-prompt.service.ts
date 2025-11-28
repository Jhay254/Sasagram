import prisma from '../db/prisma';
import { NotificationService, NotificationType } from './notification.service';

export class DiaryPromptService {
    /**
     * Create diary entry (quick capture)
     */
    static async createDiaryEntry(
        userId: string,
        content: string,
        mood?: string,
        location?: { latitude: number; longitude: number }
    ) {
        return await prisma.diaryEntry.create({
            data: {
                userId,
                content,
                mood,
                latitude: location?.latitude,
                longitude: location?.longitude,
            },
        });
    }

    /**
     * Get user's diary entries
     */
    static async getDiaryEntries(
        userId: string,
        startDate?: Date,
        endDate?: Date,
        limit: number = 50
    ) {
        const where: any = { userId };

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        return await prisma.diaryEntry.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get diary prompt settings
     */
    static async getPromptSettings(userId: string) {
        let settings = await prisma.diaryPromptSettings.findUnique({
            where: { userId },
        });

        if (!settings) {
            // Create default settings
            settings = await prisma.diaryPromptSettings.create({
                data: {
                    userId,
                    enabled: true,
                    promptTime: '20:00', // 8 PM default
                    promptDays: [1, 2, 3, 4, 5, 6, 7], // All days
                },
            });
        }

        return settings;
    }

    /**
     * Update prompt settings
     */
    static async updatePromptSettings(userId: string, settings: any) {
        return await prisma.diaryPromptSettings.upsert({
            where: { userId },
            update: settings,
            create: {
                userId,
                ...settings,
            },
        });
    }

    /**
     * Get random diary prompt
     */
    static getRandomPrompt(): string {
        const prompts = [
            "What made you smile today?",
            "What are you grateful for?",
            "What challenged you today?",
            "What's something new you learned?",
            "Who did you connect with today?",
            "What's on your mind right now?",
            "What was the highlight of your day?",
            "What would you do differently tomorrow?",
            "What's something you're looking forward to?",
            "How are you feeling right now?",
            "What's a moment you want to remember from today?",
            "What surprised you today?",
        ];

        return prompts[Math.floor(Math.random() * prompts.length)];
    }

    /**
     * Sync offline diary entries
     */
    static async syncOfflineEntries(userId: string, entries: any[]) {
        const created = [];

        for (const entry of entries) {
            const created_entry = await this.createDiaryEntry(
                userId,
                entry.content,
                entry.mood,
                entry.location
            );
            created.push(created_entry);
        }

        return created;
    }
}
