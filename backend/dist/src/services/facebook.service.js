"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const queue_service_1 = require("./queue.service");
const prisma = new client_1.PrismaClient();
class FacebookService {
    constructor() {
        this.clientId = process.env.FACEBOOK_CLIENT_ID || '';
        this.clientSecret = process.env.FACEBOOK_CLIENT_SECRET || '';
        this.redirectUri = process.env.FACEBOOK_REDIRECT_URI || '';
    }
    getAuthUrl() {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: 'public_profile,email,user_posts', // user_posts requires app review
            response_type: 'code',
            state: 'facebook_auth_state', // Should be random in production
        });
        return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    }
    async exchangeCodeForToken(code) {
        const response = await axios_1.default.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                client_secret: this.clientSecret,
                code,
            },
        });
        return response.data;
    }
    async getUserInfo(accessToken) {
        const response = await axios_1.default.get('https://graph.facebook.com/me', {
            params: {
                access_token: accessToken,
                fields: 'id,name,email',
            },
        });
        return response.data;
    }
    async refreshToken(accessToken) {
        const response = await axios_1.default.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                fb_exchange_token: accessToken,
            },
        });
        return response.data;
    }
    async fetchPosts(accessToken, userId) {
        try {
            const response = await axios_1.default.get('https://graph.facebook.com/me/posts', {
                params: {
                    access_token: accessToken,
                    fields: 'id,message,created_time,full_picture,permalink_url,likes.summary(true)',
                    limit: 25,
                },
            });
            if (!response.data.data) {
                console.log('No Facebook posts found');
                return;
            }
            for (const post of response.data.data) {
                const content = await prisma.content.upsert({
                    where: {
                        provider_platformId: {
                            provider: 'FACEBOOK',
                            platformId: post.id,
                        },
                    },
                    update: {
                        text: post.message || null,
                        mediaUrls: post.full_picture ? JSON.stringify([post.full_picture]) : null,
                        engagementLikes: post.likes?.summary.total_count || 0,
                    },
                    create: {
                        userId,
                        provider: 'FACEBOOK',
                        platformId: post.id,
                        contentType: 'post',
                        text: post.message || null,
                        mediaUrls: post.full_picture ? JSON.stringify([post.full_picture]) : null,
                        timestamp: new Date(post.created_time),
                        engagementLikes: post.likes?.summary.total_count || 0,
                    },
                });
                // Queue media download if present
                if (post.full_picture) {
                    await queue_service_1.mediaQueue.add({
                        url: post.full_picture,
                        userId,
                        provider: 'FACEBOOK',
                        contentId: content.id,
                    });
                }
            }
            console.log(`Fetched ${response.data.data.length} Facebook posts`);
        }
        catch (error) {
            console.error('Error fetching Facebook posts:', error);
            // Don't throw here to avoid failing the whole auth process if just posts fail
        }
    }
}
exports.FacebookService = FacebookService;
