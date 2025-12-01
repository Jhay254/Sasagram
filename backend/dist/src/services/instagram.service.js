"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const queue_service_1 = require("./queue.service");
const prisma = new client_1.PrismaClient();
class InstagramService {
    constructor() {
        this.clientId = process.env.INSTAGRAM_CLIENT_ID || '';
        this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || '';
        this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || '';
    }
    getAuthUrl() {
        const scopes = ['user_profile', 'user_media'];
        return `https://api.instagram.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scopes.join(',')}&response_type=code`;
    }
    async exchangeCodeForToken(code) {
        const response = await axios_1.default.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: this.redirectUri,
            code,
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.data;
    }
    async refreshToken(accessToken) {
        const response = await axios_1.default.get('https://graph.instagram.com/refresh_access_token', {
            params: {
                grant_type: 'ig_refresh_token',
                access_token: accessToken,
            },
        });
        return {
            access_token: response.data.access_token,
            expires_in: response.data.expires_in,
        };
    }
    async fetchMedia(accessToken, userId) {
        try {
            const response = await axios_1.default.get(`https://graph.instagram.com/me/media`, {
                params: {
                    fields: 'id,caption,media_type,media_url,timestamp,like_count',
                    access_token: accessToken,
                },
            });
            for (const media of response.data.data) {
                // Store content metadata
                const content = await prisma.content.upsert({
                    where: {
                        provider_platformId: {
                            provider: 'INSTAGRAM',
                            platformId: media.id,
                        },
                    },
                    update: {
                        text: media.caption || null,
                        mediaUrls: media.media_url ? JSON.stringify([media.media_url]) : null,
                        engagementLikes: media.like_count || 0,
                    },
                    create: {
                        userId,
                        provider: 'INSTAGRAM',
                        platformId: media.id,
                        contentType: media.media_type.toLowerCase(),
                        text: media.caption || null,
                        mediaUrls: media.media_url ? JSON.stringify([media.media_url]) : null,
                        timestamp: new Date(media.timestamp),
                        engagementLikes: media.like_count || 0,
                    },
                });
                // Queue media download
                if (media.media_url) {
                    await queue_service_1.mediaQueue.add({
                        url: media.media_url,
                        userId,
                        provider: 'INSTAGRAM',
                        contentId: content.id,
                    });
                }
            }
            console.log(`Fetched ${response.data.data.length} Instagram media items`);
        }
        catch (error) {
            console.error('Error fetching Instagram media:', error);
            throw error;
        }
    }
}
exports.InstagramService = InstagramService;
