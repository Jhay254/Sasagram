import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { mediaQueue } from './queue.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface FacebookTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface FacebookUser {
    id: string;
    name: string;
    email?: string;
}

interface FacebookPost {
    id: string;
    message?: string;
    created_time: string;
    full_picture?: string;
    permalink_url?: string;
    likes?: {
        summary: {
            total_count: number;
        };
    };
}

interface FacebookFeedResponse {
    data: FacebookPost[];
    paging?: {
        next?: string;
    };
}

export class FacebookService {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.FACEBOOK_CLIENT_ID || '';
        this.clientSecret = process.env.FACEBOOK_CLIENT_SECRET || '';
        this.redirectUri = process.env.FACEBOOK_REDIRECT_URI || '';
    }

    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: 'public_profile,email,user_posts', // user_posts requires app review
            response_type: 'code',
            state: 'facebook_auth_state', // Should be random in production
        });
        return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    }

    async exchangeCodeForToken(code: string): Promise<FacebookTokenResponse> {
        const response = await axios.get<FacebookTokenResponse>(
            'https://graph.facebook.com/v18.0/oauth/access_token',
            {
                params: {
                    client_id: this.clientId,
                    redirect_uri: this.redirectUri,
                    client_secret: this.clientSecret,
                    code,
                },
            }
        );
        return response.data;
    }

    async getUserInfo(accessToken: string): Promise<FacebookUser> {
        const response = await axios.get<FacebookUser>(
            'https://graph.facebook.com/me',
            {
                params: {
                    access_token: accessToken,
                    fields: 'id,name,email',
                },
            }
        );
        return response.data;
    }

    async refreshToken(accessToken: string): Promise<FacebookTokenResponse> {
        const response = await axios.get<FacebookTokenResponse>(
            'https://graph.facebook.com/v18.0/oauth/access_token',
            {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    fb_exchange_token: accessToken,
                },
            }
        );
        return response.data;
    }

    async fetchPosts(accessToken: string, userId: string): Promise<void> {
        try {
            const response = await axios.get<FacebookFeedResponse>(
                'https://graph.facebook.com/me/posts',
                {
                    params: {
                        access_token: accessToken,
                        fields: 'id,message,created_time,full_picture,permalink_url,likes.summary(true)',
                        limit: 25,
                    },
                }
            );

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
                    await mediaQueue.add({
                        url: post.full_picture,
                        userId,
                        provider: 'FACEBOOK',
                        contentId: content.id,
                    });
                }
            }

            console.log(`Fetched ${response.data.data.length} Facebook posts`);
        } catch (error) {
            console.error('Error fetching Facebook posts:', error);
            // Don't throw here to avoid failing the whole auth process if just posts fail
        }
    }

    /**
     * Verify a signed request from Facebook
     * Used for data deletion callbacks and other secure Facebook Platform features
     */
    verifySignedRequest(signedRequest: string): { valid: boolean; data?: any } {
        try {
            if (!signedRequest || !signedRequest.includes('.')) {
                logger.warn('Invalid signed request format');
                return { valid: false };
            }

            const [encodedSig, payload] = signedRequest.split('.');

            // Decode signature from base64url
            const sig = Buffer.from(encodedSig, 'base64url');

            // Decode payload from base64url
            const data = JSON.parse(Buffer.from(payload, 'base64url').toString());

            // Get app secret from environment
            const appSecret = this.clientSecret;
            if (!appSecret) {
                logger.error('FACEBOOK_CLIENT_SECRET not configured');
                return { valid: false };
            }

            // Calculate expected signature
            const expectedSig = crypto
                .createHmac('sha256', appSecret)
                .update(payload)
                .digest();

            // Use timing-safe comparison to prevent timing attacks
            if (!crypto.timingSafeEqual(sig, expectedSig)) {
                logger.warn('Facebook signed request signature mismatch');
                return { valid: false };
            }

            logger.info('Facebook signed request verified successfully');
            return { valid: true, data };
        } catch (error) {
            logger.error('Error verifying Facebook signed request:', error);
            return { valid: false };
        }
    }
}
