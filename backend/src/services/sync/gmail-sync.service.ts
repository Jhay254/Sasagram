import { google } from 'googleapis';
import prisma from '../../db/prisma';

interface SyncResult {
    success: boolean;
    itemsFetched: number;
    itemsProcessed: number;
    errors: string[];
}

export class GmailSyncService {
    private static readonly BATCH_SIZE = 100;
    private static readonly EVENT_KEYWORDS = [
        'flight',
        'booking',
        'reservation',
        'ticket',
        'confirmation',
        'hotel',
        'itinerary',
        'conference',
        'meeting',
        'event',
    ];

    /**
     * Sync all data from a Gmail data source
     */
    static async syncDataSource(dataSourceId: string): Promise<SyncResult> {
        const result: SyncResult = {
            success: false,
            itemsFetched: 0,
            itemsProcessed: 0,
            errors: [],
        };

        try {
            // Get data source
            const dataSource = await prisma.dataSource.findUnique({
                where: { id: dataSourceId },
            });

            if (!dataSource || dataSource.provider !== 'GMAIL') {
                throw new Error('Invalid Gmail data source');
            }

            if (!dataSource.accessToken) {
                throw new Error('No access token available');
            }

            // Update status
            await prisma.dataSource.update({
                where: { id: dataSourceId },
                data: { syncStatus: 'IN_PROGRESS' },
            });

            // Fetch event emails
            const emailCount = await this.fetchEventEmails(dataSourceId, dataSource.accessToken);
            result.itemsFetched = emailCount;
            result.itemsProcessed = emailCount;

            // Update data source
            await prisma.dataSource.update({
                where: { id: dataSourceId },
                data: {
                    syncStatus: 'COMPLETED',
                    lastSyncAt: new Date(),
                    itemCount: { increment: emailCount },
                },
            });

            result.success = true;
        } catch (error: any) {
            result.errors.push(error.message);

            await prisma.dataSource.update({
                where: { id: dataSourceId },
                data: {
                    syncStatus: 'FAILED',
                    lastSyncError: error.message,
                },
            });
        }

        return result;
    }

    /**
     * Fetch emails that indicate events (bookings, tickets, etc.)
     */
    static async fetchEventEmails(dataSourceId: string, accessToken: string): Promise<number> {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        let totalFetched = 0;

        try {
            // Search for event-related emails
            const query = this.EVENT_KEYWORDS.map(kw => `subject:${kw}`).join(' OR ');

            const response = await gmail.users.messages.list({
                userId: 'me',
                q: query,
                maxResults: this.BATCH_SIZE,
            });

            if (!response.data.messages) {
                return 0;
            }

            // Fetch full metadata for each message
            for (const message of response.data.messages) {
                if (!message.id) continue;

                const fullMessage = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'metadata',
                    metadataHeaders: ['From', 'To', 'Subject', 'Date'],
                });

                await this.saveEmailMetadata(dataSourceId, fullMessage.data);
                totalFetched++;

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error: any) {
            if (error.code === 429) {
                throw new Error('Gmail API rate limit exceeded');
            }
            throw error;
        }

        return totalFetched;
    }

    /**
     * Save email metadata
     */
    private static async saveEmailMetadata(
        dataSourceId: string,
        message: any
    ): Promise<void> {
        // Check if already exists
        const existing = await prisma.emailMetadata.findFirst({
            where: {
                dataSourceId,
                externalId: message.id,
            },
        });

        if (existing) {
            return;
        }

        // Parse headers
        const headers = message.payload?.headers || [];
        const getHeader = (name: string) =>
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const subject = getHeader('Subject');
        const from = getHeader('From');
        const to = getHeader('To');
        const date = getHeader('Date');

        // Extract date
        let receivedAt = new Date();
        if (date) {
            receivedAt = new Date(date);
        }

        // Create email metadata
        await prisma.emailMetadata.create({
            data: {
                dataSourceId,
                externalId: message.id,
                provider: 'GMAIL',
                subject,
                sender: from,
                recipients: to.split(',').map((r: string) => r.trim()),
                receivedAt,
                category: this.categorizeEmail(subject),
            },
        });
    }

    /**
     * Categorize email based on subject
     */
    private static categorizeEmail(subject: string): string {
        const lower = subject.toLowerCase();

        if (lower.includes('flight') || lower.includes('airline')) {
            return 'TRAVEL_FLIGHT';
        }
        if (lower.includes('hotel') || lower.includes('accommodation')) {
            return 'TRAVEL_HOTEL';
        }
        if (lower.includes('ticket') || lower.includes('event') || lower.includes('concert')) {
            return 'EVENT_TICKET';
        }
        if (lower.includes('booking') || lower.includes('reservation')) {
            return 'BOOKING';
        }
        if (lower.includes('conference') || lower.includes('meeting')) {
            return 'PROFESSIONAL';
        }

        return 'OTHER';
    }

    /**
     * Fetch all emails (not just events) - use sparingly
     */
    static async fetchAllEmails(
        dataSourceId: string,
        accessToken: string,
        maxResults: number = 500
    ): Promise<number> {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        let totalFetched = 0;

        try {
            const response = await gmail.users.messages.list({
                userId: 'me',
                q: 'category:primary',
                maxResults,
            });

            if (!response.data.messages) {
                return 0;
            }

            for (const message of response.data.messages) {
                if (!message.id) continue;

                const fullMessage = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'metadata',
                    metadataHeaders: ['From', 'To', 'Subject', 'Date'],
                });

                await this.saveEmailMetadata(dataSourceId, fullMessage.data);
                totalFetched++;

                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error: any) {
            if (error.code === 429) {
                throw new Error('Gmail API rate limit exceeded');
            }
            throw error;
        }

        return totalFetched;
    }
}
