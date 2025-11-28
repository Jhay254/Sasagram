import cron from 'node-cron';
import prisma from '../db/prisma';
import { InstagramSyncService } from '../services/sync/instagram-sync.service';
import { TwitterSyncService } from '../services/sync/twitter-sync.service';
import { GmailSyncService } from '../services/sync/gmail-sync.service';

/**
 * Background sync job service
 * Handles scheduled syncing of all connected data sources
 */
export class SyncJobService {
    private static isRunning = false;

    /**
     * Start all background sync jobs
     */
    static startJobs(): void {
        console.log('🔄 Starting background sync jobs...');

        // Daily sync at 3 AM UTC
        cron.schedule('0 3 * * *', async () => {
            console.log('🌙 Running daily sync job at 3 AM UTC');
            await this.syncAllDataSources();
        });

        // Incremental sync every 6 hours
        cron.schedule('0 */6 * * *', async () => {
            console.log('🔄 Running incremental sync (every 6 hours)');
            await this.syncRecentDataSources();
        });

        console.log('✅ Background sync jobs started');
    }

    /**
     * Sync all data sources (full sync)
     */
    static async syncAllDataSources(): Promise<void> {
        if (this.isRunning) {
            console.log('⏭️ Sync already running, skipping...');
            return;
        }

        this.isRunning = true;

        try {
            // Get all active data sources
            const dataSources = await prisma.dataSource.findMany({
                where: {
                    connected: true,
                },
            });

            console.log(`📊 Found ${dataSources.length} active data sources`);

            // Sync each data source
            for (const dataSource of dataSources) {
                await this.syncDataSource(dataSource.id);
            }

            console.log('✅ Full sync completed');
        } catch (error) {
            console.error('❌ Full sync failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Sync only recently active data sources (incremental)
     */
    static async syncRecentDataSources(): Promise<void> {
        if (this.isRunning) {
            console.log('⏭️ Sync already running, skipping...');
            return;
        }

        this.isRunning = true;

        try {
            // Get data sources synced in last 24 hours or never synced
            const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const dataSources = await prisma.dataSource.findMany({
                where: {
                    connected: true,
                    OR: [
                        { lastSyncAt: { gte: recentThreshold } },
                        { lastSyncAt: null },
                    ],
                },
            });

            console.log(`📊 Found ${dataSources.length} recent data sources`);

            for (const dataSource of dataSources) {
                await this.syncDataSource(dataSource.id);
            }

            console.log('✅ Incremental sync completed');
        } catch (error) {
            console.error('❌ Incremental sync failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Sync a single data source
     */
    static async syncDataSource(dataSourceId: string): Promise<void> {
        try {
            const dataSource = await prisma.dataSource.findUnique({
                where: { id: dataSourceId },
            });

            if (!dataSource) {
                console.error(`❌ Data source not found: ${dataSourceId}`);
                return;
            }

            console.log(`🔄 Syncing ${dataSource.provider} for user ${dataSource.userId}`);

            let result;

            switch (dataSource.provider) {
                case 'INSTAGRAM':
                    result = await InstagramSyncService.syncDataSource(dataSourceId);
                    break;
                case 'TWITTER':
                    result = await TwitterSyncService.syncDataSource(dataSourceId);
                    break;
                case 'GMAIL':
                    result = await GmailSyncService.syncDataSource(dataSourceId);
                    break;
                default:
                    console.log(`⚠️ Unsupported provider: ${dataSource.provider}`);
                    return;
            }

            if (result.success) {
                console.log(`✅ Synced ${result.itemsFetched} items from ${dataSource.provider}`);
            } else {
                console.error(`❌ Sync failed for ${dataSource.provider}:`, result.errors);
            }
        } catch (error) {
            console.error(`❌ Error syncing data source ${dataSourceId}:`, error);
        }
    }

    /**
     * Manually trigger sync for a specific user
     */
    static async syncUserDataSources(userId: string): Promise<void> {
        const dataSources = await prisma.dataSource.findMany({
            where: {
                userId,
                connected: true,
            },
        });

        console.log(`🔄 Manually syncing ${dataSources.length} data sources for user ${userId}`);

        for (const dataSource of dataSources) {
            await this.syncDataSource(dataSource.id);
        }
    }

    /**
     * Get sync status for all data sources
     */
    static async getSyncStatus() {
        const total = await prisma.dataSource.count({ where: { connected: true } });
        const syncing = await prisma.dataSource.count({
            where: { connected: true, syncStatus: 'IN_PROGRESS' },
        });
        const failed = await prisma.dataSource.count({
            where: { connected: true, syncStatus: 'FAILED' },
        });
        const completed = await prisma.dataSource.count({
            where: { connected: true, syncStatus: 'COMPLETED' },
        });

        return {
            total,
            syncing,
            failed,
            completed,
            pending: total - syncing - failed - completed,
            isRunning: this.isRunning,
        };
    }
}
