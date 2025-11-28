import axios from 'axios';
import prisma from '../db/prisma';
import { encrypt, decrypt } from '../utils/encryption.utils';

interface OAuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    providerUserId?: string;
    providerUsername?: string;
    providerEmail?: string;
}

export class OAuthService {
    // Instagram OAuth
    static getInstagramAuthUrl(state: string): string {
        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
        const scope = 'user_profile,user_media';

        return `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
    }

    static async exchangeInstagramCode(code: string): Promise<OAuthTokens> {
        const response = await axios.post('https://api.instagram.com/oauth/access_token', {
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
            code,
        });

        return {
            accessToken: response.data.access_token,
            providerUserId: response.data.user_id,
        };
    }

    static async getInstagramLongLivedToken(shortLivedToken: string): Promise<OAuthTokens> {
        const response = await axios.get('https://graph.instagram.com/access_token', {
            params: {
                grant_type: 'ig_exchange_token',
                client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
                access_token: shortLivedToken,
            },
        });

        return {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in,
        };
    }

    // Twitter/X OAuth 2.0
    static getTwitterAuthUrl(state: string, codeChallenge: string): string {
        const clientId = process.env.TWITTER_CLIENT_ID;
        const redirectUri = process.env.TWITTER_REDIRECT_URI;
        const scope = 'tweet.read users.read offline.access';

        return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    }

    static async exchangeTwitterCode(code: string, codeVerifier: string): Promise<OAuthTokens> {
        const auth = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64');

        const response = await axios.post(
            'https://api.twitter.com/2/oauth2/token',
            new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                client_id: process.env.TWITTER_CLIENT_ID!,
                redirect_uri: process.env.TWITTER_REDIRECT_URI!,
                code_verifier: codeVerifier,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${auth}`,
                },
            }
        );

        // Get user info
        const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
            headers: {
                Authorization: `Bearer ${response.data.access_token}`,
            },
        });

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in,
            providerUserId: userResponse.data.data.id,
            providerUsername: userResponse.data.data.username,
        };
    }

    // Facebook OAuth
    static getFacebookAuthUrl(state: string): string {
        const appId = process.env.FACEBOOK_APP_ID;
        const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
        const scope = 'email,user_posts,user_photos';

        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    }

    static async exchangeFacebookCode(code: string): Promise<OAuthTokens> {
        const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
                code,
            },
        });

        // Get user info
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token: response.data.access_token,
                fields: 'id,name,email',
            },
        });

        return {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in,
            providerUserId: userResponse.data.id,
            providerUsername: userResponse.data.name,
            providerEmail: userResponse.data.email,
        };
    }

    // LinkedIn OAuth
    static getLinkedInAuthUrl(state: string): string {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
        const scope = 'r_liteprofile r_emailaddress w_member_social';

        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    }

    static async exchangeLinkedInCode(code: string): Promise<OAuthTokens> {
        const response = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: process.env.LINKEDIN_CLIENT_ID!,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
                redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in,
        };
    }

    // Google OAuth (for Gmail)
    static getGoogleAuthUrl(state: string): string {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;
        const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email';

        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&state=${state}`;
    }

    static async exchangeGoogleCode(code: string): Promise<OAuthTokens> {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        });

        // Get user email
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${response.data.access_token}`,
            },
        });

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in,
            providerEmail: userResponse.data.email,
        };
    }

    // Microsoft OAuth (for Outlook)
    static getMicrosoftAuthUrl(state: string): string {
        const clientId = process.env.MICROSOFT_CLIENT_ID;
        const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
        const scope = 'https://graph.microsoft.com/Mail.Read offline_access';

        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&state=${state}`;
    }

    static async exchangeMicrosoftCode(code: string): Promise<OAuthTokens> {
        const response = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            new URLSearchParams({
                client_id: process.env.MICROSOFT_CLIENT_ID!,
                client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
                code,
                redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
                grant_type: 'authorization_code',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in,
        };
    }

    // Store OAuth tokens securely
    static async storeDataSource(
        userId: string,
        type: string,
        tokens: OAuthTokens
    ): Promise<void> {
        const expiresAt = tokens.expiresIn
            ? new Date(Date.now() + tokens.expiresIn * 1000)
            : null;

        await prisma.dataSource.upsert({
            where: {
                userId_type: { userId, type },
            },
            update: {
                accessToken: encrypt(tokens.accessToken),
                refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
                tokenExpiresAt: expiresAt,
                providerUserId: tokens.providerUserId,
                providerUsername: tokens.providerUsername,
                providerEmail: tokens.providerEmail,
                status: 'CONNECTED',
            },
            create: {
                userId,
                type,
                accessToken: encrypt(tokens.accessToken),
                refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
                tokenExpiresAt: expiresAt,
                providerUserId: tokens.providerUserId,
                providerUsername: tokens.providerUsername,
                providerEmail: tokens.providerEmail,
                status: 'CONNECTED',
            },
        });
    }

    // Retrieve and decrypt tokens
    static async getDataSourceTokens(userId: string, type: string): Promise<OAuthTokens | null> {
        const dataSource = await prisma.dataSource.findUnique({
            where: { userId_type: { userId, type } },
        });

        if (!dataSource || !dataSource.accessToken) {
            return null;
        }

        return {
            accessToken: decrypt(dataSource.accessToken),
            refreshToken: dataSource.refreshToken ? decrypt(dataSource.refreshToken) : undefined,
        };
    }
}
