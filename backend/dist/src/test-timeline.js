"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_service_1 = require("./services/biography/timeline.service");
const logger_1 = require("./utils/logger");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testTimeline() {
    try {
        logger_1.logger.info('Starting Timeline Service Test...');
        // 1. Create a dummy user
        const user = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                name: 'Timeline Test User',
            },
        });
        logger_1.logger.info(`Created test user: ${user.id}`);
        // 2. Create some dummy content
        const baseTime = new Date();
        // Cluster 1: Today
        await prisma.content.create({
            data: {
                userId: user.id,
                provider: 'TWITTER',
                platformId: `tweet-${Date.now()}-1`,
                contentType: 'post',
                text: 'Hello world!',
                timestamp: baseTime,
            },
        });
        await prisma.content.create({
            data: {
                userId: user.id,
                provider: 'INSTAGRAM',
                platformId: `insta-${Date.now()}-2`,
                contentType: 'image',
                text: 'My lunch',
                timestamp: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000), // +2 hours
            },
        });
        // Gap: 40 days ago
        const pastTime = new Date(baseTime.getTime() - 40 * 24 * 60 * 60 * 1000);
        await prisma.content.create({
            data: {
                userId: user.id,
                provider: 'FACEBOOK',
                platformId: `fb-${Date.now()}-3`,
                contentType: 'post',
                text: 'Old memory',
                timestamp: pastTime,
            },
        });
        // 3. Run Timeline Service
        logger_1.logger.info('Constructing timeline...');
        const timeline = await timeline_service_1.timelineService.constructTimeline(user.id);
        // 4. Verify Results
        console.log('------------------------------------------------');
        console.log(`Total Events: ${timeline.events.length} (Expected: 3)`);
        console.log(`Clusters: ${timeline.clusters.length} (Expected: 1 or 2 depending on logic)`);
        console.log(`Gaps: ${timeline.gaps.length} (Expected: 1)`);
        console.log('------------------------------------------------');
        if (timeline.events.length === 3 && timeline.gaps.length >= 1) {
            logger_1.logger.info('✅ Timeline Service Test PASSED');
        }
        else {
            logger_1.logger.error('❌ Timeline Service Test FAILED');
        }
        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });
    }
    catch (error) {
        logger_1.logger.error('Test failed with error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testTimeline();
