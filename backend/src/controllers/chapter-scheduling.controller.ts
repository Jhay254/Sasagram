import { Request, Response } from 'express';
import { ChapterSchedulingService, ReleasePattern } from '../services/chapter-scheduling.service';

/**
 * Schedule a single chapter for future release
 * POST /api/chapters/:id/schedule
 */
export const scheduleChapter = async (req: Request, res: Response) => {
    try {
        const { id: chapterId } = req.params;
        const { scheduledReleaseAt } = req.body;

        if (!scheduledReleaseAt) {
            return res.status(400).json({ error: 'scheduledReleaseAt is required' });
        }

        const releaseDate = new Date(scheduledReleaseAt);

        if (releaseDate <= new Date()) {
            return res.status(400).json({ error: 'Release date must be in the future' });
        }

        await ChapterSchedulingService.scheduleChapter(chapterId, releaseDate);

        res.json({
            success: true,
            message: 'Chapter scheduled successfully',
            scheduledReleaseAt: releaseDate,
        });
    } catch (error: any) {
        console.error('Error scheduling chapter:', error);
        res.status(500).json({ error: error.message || 'Failed to schedule chapter' });
    }
};

/**
 * Get schedule info for a chapter
 * GET /api/chapters/:id/schedule
 */
export const getChapterSchedule = async (req: Request, res: Response) => {
    try {
        const { id: chapterId } = req.params;

        const schedule = await ChapterSchedulingService.getChapterScheduleInfo(chapterId);

        if (!schedule) {
            return res.status(404).json({ error: 'Chapter not found' });
        }

        res.json(schedule);
    } catch (error: any) {
        console.error('Error getting chapter schedule:', error);
        res.status(500).json({ error: error.message || 'Failed to get schedule' });
    }
};

/**
 * Cancel chapter schedule
 * DELETE /api/chapters/:id/schedule
 */
export const cancelChapterSchedule = async (req: Request, res: Response) => {
    try {
        const { id: chapterId } = req.params;

        await ChapterSchedulingService.cancelChapterSchedule(chapterId);

        res.json({
            success: true,
            message: 'Schedule cancelled',
        });
    } catch (error: any) {
        console.error('Error cancelling schedule:', error);
        res.status(500).json({ error: error.message || 'Failed to cancel schedule' });
    }
};

/**
 * Create or update biography-wide release schedule
 * POST /api/biographies/:id/schedule
 */
export const createBiographySchedule = async (req: Request, res: Response) => {
    try {
        const { id: biographyId } = req.params;
        const { pattern, dayOfWeek, timeOfDay, customCron, timezone } = req.body;

        if (!pattern) {
            return res.status(400).json({ error: 'Release pattern is required' });
        }

        const releasePattern: ReleasePattern = {
            pattern,
            dayOfWeek,
            timeOfDay,
            customCron,
            timezone,
        };

        const schedule = await ChapterSchedulingService.createBiographySchedule(
            biographyId,
            releasePattern
        );

        res.json({
            success: true,
            schedule,
        });
    } catch (error: any) {
        console.error('Error creating biography schedule:', error);
        res.status(500).json({ error: error.message || 'Failed to create schedule' });
    }
};

/**
 * Get biography schedule
 * GET /api/biographies/:id/schedule
 */
export const getBiographySchedule = async (req: Request, res: Response) => {
    try {
        const { id: biographyId } = req.params;

        const schedule = await ChapterSchedulingService.getBiographySchedule(biographyId);

        if (!schedule) {
            return res.status(404).json({ error: 'No schedule found for this biography' });
        }

        res.json(schedule);
    } catch (error: any) {
        console.error('Error getting biography schedule:', error);
        res.status(500).json({ error: error.message || 'Failed to get schedule' });
    }
};

/**
 * Delete biography schedule
 * DELETE /api/biographies/:id/schedule
 */
export const deleteBiographySchedule = async (req: Request, res: Response) => {
    try {
        const { id: biographyId } = req.params;

        await ChapterSchedulingService.deleteBiographySchedule(biographyId);

        res.json({
            success: true,
            message: 'Schedule deleted',
        });
    } catch (error: any) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ error: error.message || 'Failed to delete schedule' });
    }
};

/**
 * Get upcoming chapters for a biography
 * GET /api/biographies/:id/upcoming
 */
export const getUpcomingChapters = async (req: Request, res: Response) => {
    try {
        const { id: biographyId } = req.params;

        const chapters = await ChapterSchedulingService.getUpcomingChapters(biographyId);

        res.json({
            count: chapters.length,
            chapters,
        });
    } catch (error: any) {
        console.error('Error getting upcoming chapters:', error);
        res.status(500).json({ error: error.message || 'Failed to get upcoming chapters' });
    }
};

/**
 * Check if chapter is complete
 * GET /api/chapters/:id/completion
 */
export const checkChapterCompletion = async (req: Request, res: Response) => {
    try {
        const { id: chapterId } = req.params;

        const isComplete = await ChapterSchedulingService.isChapterComplete(chapterId);

        res.json({
            chapterId,
            isComplete,
        });
    } catch (error: any) {
        console.error('Error checking chapter completion:', error);
        res.status(500).json({ error: error.message || 'Failed to check completion' });
    }
};

/**
 * Manually trigger chapter release job (for testing)
 * POST /api/jobs/release-chapters
 */
export const triggerReleaseJob = async (req: Request, res: Response) => {
    try {
        await ChapterSchedulingService.releaseScheduledChapters();

        res.json({
            success: true,
            message: 'Release job executed',
        });
    } catch (error: any) {
        console.error('Error triggering release job:', error);
        res.status(500).json({ error: error.message || 'Failed to trigger job' });
    }
};
