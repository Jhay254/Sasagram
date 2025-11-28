import { Request, Response } from 'express';
import { DiaryPromptService } from '../services/diary-prompt.service';

/**
 * Create diary entry
 */
export async function createDiaryEntry(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { content, mood, location } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const entry = await DiaryPromptService.createDiaryEntry(
            userId,
            content,
            mood,
            location
        );

        res.json({
            success: true,
            data: entry,
        });
    } catch (error: any) {
        console.error('Error creating entry:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get diary entries
 */
export async function getDiaryEntries(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { startDate, endDate, limit = 50 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const entries = await DiaryPromptService.getDiaryEntries(
            userId,
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined,
            Number(limit)
        );

        res.json({
            success: true,
            data: entries,
        });
    } catch (error: any) {
        console.error('Error getting entries:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get prompt settings
 */
export async function getPromptSettings(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const settings = await DiaryPromptService.getPromptSettings(userId);

        res.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error('Error getting settings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Update prompt settings
 */
export async function updatePromptSettings(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const settings = await DiaryPromptService.updatePromptSettings(userId, req.body);

        res.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get random prompt
 */
export async function getRandomPrompt(req: Request, res: Response) {
    try {
        const prompt = DiaryPromptService.getRandomPrompt();

        res.json({
            success: true,
            data: { prompt },
        });
    } catch (error: any) {
        console.error('Error getting prompt:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Sync offline entries
 */
export async function syncOfflineEntries(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { entries } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const synced = await DiaryPromptService.syncOfflineEntries(userId, entries);

        res.json({
            success: true,
            data: synced,
        });
    } catch (error: any) {
        console.error('Error syncing entries:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
