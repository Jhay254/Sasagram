"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlookService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class OutlookService {
    constructor() {
        this.tenantId = 'common'; // Use 'common' for personal and work accounts
        this.clientId = process.env.OUTLOOK_CLIENT_ID || '';
        this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET || '';
        this.redirectUri = process.env.OUTLOOK_REDIRECT_URI || '';
    }
    getAuthUrl() {
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            response_mode: 'query',
            scope: 'openid profile email Mail.Read offline_access',
            state: 'outlook_auth_state',
        });
        return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
    }
    async exchangeCodeForToken(code) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            scope: 'Mail.Read offline_access',
            code,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
            client_secret: this.clientSecret,
        });
        const response = await axios_1.default.post(`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
    async getUserInfo(accessToken) {
        const response = await axios_1.default.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    }
    async refreshToken(refreshToken) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            scope: 'Mail.Read offline_access',
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            client_secret: this.clientSecret,
        });
        const response = await axios_1.default.post(`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
    async fetchEmails(accessToken, userId) {
        try {
            const response = await axios_1.default.get('https://graph.microsoft.com/v1.0/me/messages', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    $top: 50,
                    $select: 'id,subject,from,toRecipients,receivedDateTime,hasAttachments',
                    $orderby: 'receivedDateTime desc',
                },
            });
            if (!response.data.value) {
                console.log('No Outlook messages found');
                return;
            }
            for (const message of response.data.value) {
                const category = this.categorizeEmail(message.subject);
                await prisma.emailMetadata.upsert({
                    where: {
                        provider_emailId: {
                            provider: 'OUTLOOK',
                            emailId: message.id,
                        },
                    },
                    update: {
                        subject: message.subject,
                        sender: message.from.emailAddress.address,
                        recipient: message.toRecipients[0]?.emailAddress.address || '',
                        timestamp: new Date(message.receivedDateTime),
                        hasAttachments: message.hasAttachments,
                        category,
                    },
                    create: {
                        userId,
                        provider: 'OUTLOOK',
                        emailId: message.id,
                        subject: message.subject,
                        sender: message.from.emailAddress.address,
                        recipient: message.toRecipients[0]?.emailAddress.address || '',
                        timestamp: new Date(message.receivedDateTime),
                        hasAttachments: message.hasAttachments,
                        category,
                    },
                });
            }
            console.log(`Fetched ${response.data.value.length} Outlook messages`);
        }
        catch (error) {
            console.error('Error fetching Outlook messages:', error);
        }
    }
    categorizeEmail(subject) {
        const lowerSubject = subject.toLowerCase();
        if (lowerSubject.includes('flight') || lowerSubject.includes('boarding pass')) {
            return 'flight';
        }
        if (lowerSubject.includes('hotel') || lowerSubject.includes('reservation')) {
            return 'hotel';
        }
        if (lowerSubject.includes('receipt') || lowerSubject.includes('invoice')) {
            return 'receipt';
        }
        if (lowerSubject.includes('ticket') || lowerSubject.includes('event')) {
            return 'event';
        }
        return 'personal';
    }
}
exports.OutlookService = OutlookService;
