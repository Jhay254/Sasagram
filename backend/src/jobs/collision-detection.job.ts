import cron from 'node-cron';
import prisma from '../db/prisma';
import { MemoryGraphService } from './memory-graph.service';

/**
 * Background job for detecting memory collisions
 * Runs daily to find shared events between users
 */
export class CollisionDetectionJob {
    private static isRunning = false;

    /**
     * Start the collision detection cron job
     * Runs daily at 4 AM UTC
     */
    static startJob(): void {
        console.log('🔍 Starting collision detection cron job...');

        // Run daily at 4 AM UTC
        cron.schedule('0 4 * * *', async () => {
            console.log('🌙 Running collision detection job at 4 AM UTC');
            await this.detectCollisions();
        });

        // Also run every 6 hours for active users
        cron.schedule('0 */6 * * *', async () => {
            console.log('🔄 Running incremental collision detection');
            await this.detectCollisionsForActiveUsers();
        });

        console.log('✅ Collision detection jobs scheduled');
    }

    /**
     * Run collision detection for all users
     */
    static async detectCollisions(): Promise<void> {
        if (this.isRunning) {
            console.log('⏭️ Collision detection already running, skipping...');
            return;
        }

        this.isRunning = true;

        try {
            // Get all users with collision detection enabled
            const users = await prisma.user.findMany({
                where: {
                    collisionDetectionEnabled: true,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                },
            });

            console.log(`📊 Found ${users.length} users with collision detection enabled`);

            let totalCollisions = 0;

            // Process each user
            for (const user of users) {
                try {
                    const collisions = await MemoryGraphService.detectCollisions(user.id);
                    totalCollisions += collisions.length;

                    console.log(`✅ Found ${collisions.length} collisions for user ${user.email}`);
                } catch (error) {
                    console.error(`❌ Error detecting collisions for user ${user.id}:`, error);
                }
            }

            console.log(`✅ Collision detection complete: ${totalCollisions} total collisions found`);
        } catch (error) {
            console.error('❌ Collision detection job failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Run collision detection only for recently active users
     */
    static async detectCollisionsForActiveUsers(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        try {
            // Get users active in last 24 hours
            const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const users = await prisma.user.findMany({
                where: {
                    collisionDetectionEnabled: true,
                    updatedAt: {
                        gte: recentThreshold,
                    },
                },
                select: {
                    id: true,
                    email: true,
                },
            });

            console.log(`📊 Found ${users.length} recently active users`);

            for (const user of users) {
                try {
                    await MemoryGraphService.detectCollisions(user.id);
                } catch (error) {
                    console.error(`❌ Error for user ${user.id}:`, error);
                }
            }

            console.log('✅ Incremental collision detection complete');
        } catch (error) {
            console.error('❌ Incremental collision detection failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Manually trigger collision detection for a specific user
     */
    static async detectForUser(userId: string): Promise<number> {
        const collisions = await MemoryGraphService.detectCollisions(userId);
        console.log(`Found ${collisions.length} collisions for user ${userId}`);
        return collisions.length;
    }

    /**
     * Get job status
     */
    static getStatus() {
        return {
            isRunning: this.isRunning,
            scheduledJobs: [
                { schedule: '0 4 * * *', description: 'Daily full scan at 4 AM UTC' },
                { schedule: '0 */6 * * *', description: 'Incremental scan every 6 hours' },
            ],
        };
    }
}
