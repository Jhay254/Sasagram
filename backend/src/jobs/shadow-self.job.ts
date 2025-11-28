import cron from 'node-cron';
import { ShadowSelfService } from '../services/shadow-self.service';
import { DeletedContentService } from '../services/deleted-content.service';
import { ScreenshotDetectionService } from '../services/screenshot-detection.service';

// Expire old reports (daily at 3 AM)
export function startReportExpirationJob() {
    cron.schedule('0 3 * * *', async () => {
        try {
            const count = await ShadowSelfService.expireOldReports();
            console.log(`Expired ${count} old Shadow Self reports`);
        } catch (error) {
            console.error('Report expiration job failed:', error);
        }
    });
}

// Purge deleted content (daily at 4 AM) - GDPR compliance
export function startContentPurgeJob() {
    cron.schedule('0 4 * * *', async () => {
        try {
            const count = await DeletedContentService.purgeExpiredContent();
            console.log(`Purged ${count} expired content items (GDPR)`);
        } catch (error) {
            console.error('Content purge job failed:', error);
        }
    });
}

// Auto-unsuspend accounts (hourly)
export function startAutoUnsuspendJob() {
    cron.schedule('0 * * * *', async () => {
        try {
            await ScreenshotDetectionService.autoUnsuspend();
        } catch (error) {
            console.error('Auto-unsuspend job failed:', error);
        }
    });
}

export function startShadowSelfJobs() {
    startReportExpirationJob();
    startContentPurgeJob();
    startAutoUnsuspendJob();
    console.log('✅ Shadow Self jobs started');
}
