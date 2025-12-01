"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const queue_service_1 = require("./queue.service");
const prisma = new client_1.PrismaClient();
class TwitterService {
    constructor() {
        this.clientId = process.env.TWITTER_CLIENT_ID || '';
        this.clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
        this.redirectUri = process.env.TWITTER_REDIRECT_URI || '';
    }
    // Generate PKCE code verifier and challenge
    generatePKCE() {
        const codeVerifier = crypto_1.default.randomBytes(32).toString('base64url');
        const codeChallenge = crypto_1.default
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
        return { codeVerifier, codeChallenge };
    }
    getAuthUrl(codeChallenge, state) {
        const scopes = ['tweet.read', 'users.read', 'offline.access'];
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: scopes.join(' '),
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });
        return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    }
    async exchangeCodeForToken(code, codeVerifier) {
        const response = await axios_1.default.post('https://api.twitter.com/2/oauth2/token', new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            code_verifier: codeVerifier,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            },
        });
        return response.data;
    }
    async refreshToken(refreshToken) {
        const response = await axios_1.default.post('https://api.twitter.com/2/oauth2/token', new URLSearchParams({
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            client_id: this.clientId,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            },
        });
        return response.data;
    }
    async getUserInfo(accessToken) {
        const response = await axios_1.default.get('https://api.twitter.com/2/users/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data.data;
    }
    async fetchTweets(accessToken, twitterUserId, userId) {
        try {
            const response = await axios_1.default.get(`https://api.twitter.com/2/users/${twitterUserId}/tweets`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    max_results: 100,
                    'tweet.fields': 'created_at,public_metrics,attachments',
                    'expansions': 'attachments.media_keys',
                    'media.fields': 'url,type',
                },
            });
            if (!response.data.data) {
                console.log('No tweets found');
                return;
            }
            for (const tweet of response.data.data) {
                const content = await prisma.content.upsert({
                    where: {
                        provider_platformId: {
                            provider: 'TWITTER',
                            platformId: tweet.id,
                        },
                    },
                    update: {
                        text: tweet.text,
                        engagementLikes: tweet.public_metrics?.like_count || 0,
                    },
                    create: {
                        userId,
                        provider: 'TWITTER',
                        platformId: tweet.id,
                        contentType: 'tweet',
                        text: tweet.text,
                        timestamp: new Date(tweet.created_at),
                        engagementLikes: tweet.public_metrics?.like_count || 0,
                    },
                });
                // Queue media download if present
                if (tweet.attachments?.media_keys && response.data.includes?.media) {
                    for (const mediaKey of tweet.attachments.media_keys) {
                        const media = response.data.includes.media.find(m => m.media_key === mediaKey);
                        if (media?.url) {
                            await queue_service_1.mediaQueue.add({
                                url: media.url,
                                userId,
                                provider: 'TWITTER',
                                contentId: content.id,
                            });
                        }
                    }
                }
            }
            console.log(`Fetched ${response.data.data.length} tweets`);
        }
        catch (error) {
            console.error('Error fetching tweets:', error);
            throw error;
        }
    }
}
exports.TwitterService = TwitterService;
