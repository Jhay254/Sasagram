import cron from 'node-cron';
import { StoryMergerService } from '../services/story-merger.service';
import { CollaborationService } from '../services/collaboration.service';

/**
 * Background jobs for Story Mergers
 */

/**
 * Auto-unlock expired chapter locks (every 10 minutes)
 */
export function startLockExpirationJob() {
    cron.schedule('*/10 * * * *', async () => {
        const now = new Date().toISOString();
        console.log(`[${now}] Running lock expiration job...`);

        try {
            const count = await StoryMergerService.unlockExpiredChapters();
            console.log(`[${now}] Unlocked ${count} expired chapter locks`);
        } catch (error) {
            console.error(`[${now}] Lock expiration job failed:`, error);
        }
    });

    console.log('✓ Lock expiration job scheduled (every 10 minutes)');
}

/**
 * Expire old pending invitations (daily at 2 AM)
 */
export function startInvitationExpirationJob() {
    cron.schedule('0 2 * * *', async () => {
        const now = new Date().toISOString();
        console.log(`[${now}] Running invitation expiration job...`);

        try {
            const count = await CollaborationService.expireOldInvitations();
            console.log(`[${now}] Expired ${count} old invitations`);
        } catch (error) {
            console.error(`[${now}] Invitation expiration job failed:`, error);
        }
    });

    console.log('✓ Invitation expiration job scheduled (daily at 2 AM)');
}

/**
 * Start all Story Merger background jobs
 */
export function startMergerJobs() {
    startLockExpirationJob();
    startInvitationExpirationJob();

    console.log('✅ All Story Merger background jobs started');
}
