import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Starting test job script...');

    try {
        const { emailQueue, addJob } = await import('./config/queues');
        const { logger } = await import('./utils/logger');

        logger.info('Adding test email job...');

        await addJob(emailQueue, 'test-email', {
            to: 'test@example.com',
            subject: 'Test Email',
            body: 'This is a test email from BullMQ',
        });

        logger.info('Job added successfully.');

        // Wait for a bit
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        process.exit(1);
    }
}

main();
