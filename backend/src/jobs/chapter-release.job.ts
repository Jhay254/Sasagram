import cron from 'node-cron';
import { ChapterSchedulingService } from '../services/chapter-scheduling.service';

/**
 * Chapter Release Job
 * Runs every 15 minutes to check for scheduled chapters that need to be released
 */
export function startChapterReleaseJob() {
    // Run every 15 minutes: */15 * * * *
    cron.schedule('*/15 * * * *', async () => {
        const now = new Date().toISOString();
        console.log(`[${now}] Running chapter release job...`);

        try {
            await ChapterSchedulingService.releaseScheduledChapters();
            console.log(`[${now}] Chapter release job completed`);
        } catch (error) {
            console.error(`[${now}] Chapter release job failed:`, error);
        }
    });

    console.log('✓ Chapter release job scheduled (every 15 minutes)');
}
