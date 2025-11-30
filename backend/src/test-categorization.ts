import { timelineService } from './services/biography/timeline.service';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCategorization() {
    try {
        logger.info('Starting Categorization Service Test...');

        // 1. Create a dummy user
        const user = await prisma.user.create({
            data: {
                email: `test-cat-${Date.now()}@example.com`,
                name: 'Categorization Test User',
            },
        });
        logger.info(`Created test user: ${user.id}`);

        // 2. Create diverse content for categorization
        const baseTime = new Date();

        // Career event
        await prisma.content.create({
            data: {
                userId: user.id,
                provider: 'LINKEDIN',
                platformId: `linkedin-${Date.now()}-1`,
                contentType: 'post',
                text: 'Excited to announce my new position as Senior Software Engineer at TechCorp!',
                timestamp: baseTime,
            },
        });

        // Travel event
        await prisma.content.create({
            data: {
                userId: user.id,
                provider: 'INSTAGRAM',
                platformId: `insta-${Date.now()}-2`,
                contentType: 'image',
                text: 'Amazing sunset in Bali! #travel #vacation',
                timestamp: new Date(baseTime.getTime() + 1 * 60 * 60 * 1000), // +1 hour
            },
        });

        // Family event
        await prisma.content.create({
            data: {
                userId: user.id,
                provider: 'FACEBOOK',
                platformId: `fb-${Date.now()}-3`,
                contentType: 'post',
                text: 'Celebrating my daughter\'s 5th birthday today! 🎂',
                timestamp: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000), // +2 hours
            },
        });

        // 3. Construct timeline
        logger.info('Constructing timeline...');
        const timeline = await timelineService.constructTimeline(user.id);

        // 4. Enrich with AI categorization
        logger.info('Enriching timeline with AI categorization...');
        const enrichedTimeline = await timelineService.enrichTimeline(timeline);

        // 5. Verify Results
        console.log('================================================');
        console.log(`Total Events: ${enrichedTimeline.events.length}`);
        console.log('================================================');

        enrichedTimeline.events.forEach((event, index) => {
            console.log(`\nEvent ${index + 1}:`);
            console.log(`  Content: ${event.content.substring(0, 50)}...`);
            console.log(`  Category: ${event.category || 'NOT CATEGORIZED'}`);
            console.log(`  Tags: ${event.tags?.join(', ') || 'NONE'}`);
            console.log(`  Confidence: ${event.metadata.aiConfidence || 'N/A'}`);
        });

        console.log('\n================================================');

        const categorizedCount = enrichedTimeline.events.filter(e => e.category).length;
        if (categorizedCount === enrichedTimeline.events.length) {
            logger.info('✅ Categorization Service Test PASSED');
        } else {
            logger.error(`❌ Categorization Service Test FAILED: Only ${categorizedCount}/${enrichedTimeline.events.length} events categorized`);
        }

        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });

    } catch (error) {
        logger.error('Test failed with error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCategorization();
