import cron from 'node-cron';
import { RewindService } from '../services/rewind.service';
import prisma from '../db/prisma';

/**
 * Background jobs for Rewind feature
 */

/**
 * Send "On This Day" notifications (daily at 9 AM)
 */
export function startOnThisDayNotifications() {
    cron.schedule('0 9 * * *', async () => {
        const now = new Date().toISOString();
        console.log(`[${now}] Running On This Day notifications...`);

        try {
            // Get all active users with Rewind enabled
            const users = await prisma.user.findMany({
                where: {
                    status: 'ACTIVE',
                    rewindPreferences: {
                        enableOnThisDay: true,
                    },
                },
                select: { id: true },
            });

            let sentCount = 0;

            for (const user of users) {
                try {
                    const memories = await RewindService.findOnThisDayMemories(user.id);

                    if (memories.length > 0) {
                        // Save memories to database
                        for (const memory of memories) {
                            await prisma.onThisDayMemory.create({
                                data: {
                                    userId: user.id,
                                    originalDate: memory.originalDate,
                                    currentDate: new Date(),
                                    yearsAgo: memory.yearsAgo,
                                    title: memory.title,
                                    summary: memory.summary,
                                    contentType: 'DAY_SNAPSHOT',
                                    sourceIds: [],
                                    thumbnailUrls: [],
                                    notificationSent: true,
                                    notifiedAt: new Date(),
                                },
                            });
                        }

                        // TODO: Send push notification
                        sentCount++;
                    }
                } catch (error) {
                    console.error(`Error processing On This Day for user ${user.id}:`, error);
                }
            }

            console.log(`[${now}] Sent ${sentCount} On This Day notifications`);
        } catch (error) {
            console.error(`[${now}] On This Day job failed:`, error);
        }
    });

    console.log('✓ On This Day notifications scheduled (daily at 9 AM)');
}

/**
 * Send daily random memory notifications (daily at 10 AM)
 */
export function startRandomMemoryNotifications() {
    cron.schedule('0 10 * * *', async () => {
        const now = new Date().toISOString();
        console.log(`[${now}] Running Random Memory notifications...`);

        try {
            const users = await prisma.user.findMany({
                where: {
                    status: 'ACTIVE',
                    rewindPreferences: {
                        enableRandomMemory: true,
                    },
                },
                select: { id: true },
            });

            let sentCount = 0;

            for (const user of users) {
                try {
                    const memory = await RewindService.generateDailyRandomMemory(user.id);

                    if (memory) {
                        // Update notification status
                        await prisma.randomMemory.update({
                            where: { id: memory.id },
                            data: {
                                notificationSent: true,
                                sentAt: new Date(),
                            },
                        });

                        // TODO: Send push notification
                        sentCount++;
                    }
                } catch (error) {
                    console.error(`Error processing random memory for user ${user.id}:`, error);
                }
            }

            console.log(`[${now}] Sent ${sentCount} random memory notifications`);
        } catch (error) {
            console.error(`[${now}] Random memory job failed:`, error);
        }
    });

    console.log('✓ Random memory notifications scheduled (daily at 10 AM)');
}

/**
 * Start all Rewind background jobs
 */
export function startRewindJobs() {
    startOnThisDayNotifications();
    startRandomMemoryNotifications();

    console.log('✅ All Rewind background jobs started');
}
