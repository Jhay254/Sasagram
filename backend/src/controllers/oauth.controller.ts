import { Request, Response } from 'express';
import crypto from 'crypto';
import { OAuthService } from '../services/oauth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../db/prisma';

// Helper to generate state for CSRF protection
const generateState = (): string => crypto.randomBytes(32).toString('hex');

// Helper for Twitter PKCE
const generateCodeVerifier = (): string => crypto.randomBytes(32).toString('base64url');
const generateCodeChallenge = (verifier: string): string => {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
};

// Store state/verifier temporarily (in production, use Redis)
const oauthStates = new Map<string, { userId: string; codeVerifier?: string; provider: string }>();

// Instagram OAuth Flow
export const initiateInstagramOAuth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const state = generateState();
        oauthStates.set(state, { userId: req.user.userId, provider: 'INSTAGRAM' });

        const authUrl = OAuthService.getInstagramAuthUrl(state);
        res.json({ authUrl });
    } catch (error) {
        console.error('Instagram OAuth initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate Instagram OAuth' });
    }
};

export const handleInstagramCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            res.status(400).json({ error: 'Missing code or state' });
            return;
        }

        const stateData = oauthStates.get(state as string);
        if (!stateData) {
            res.status(400).json({ error: 'Invalid state' });
            return;
        }

        oauthStates.delete(state as string);

        // Exchange code for token
        const shortLivedTokens = await OAuthService.exchangeInstagramCode(code as string);
        const longLivedTokens = await OAuthService.getInstagramLongLivedToken(shortLivedTokens.accessToken);

        // Store in database
        await OAuthService.storeDataSource(stateData.userId, 'INSTAGRAM', {
            ...longLivedTokens,
            providerUserId: shortLivedTokens.providerUserId,
        });

        // Redirect to mobile app with success
        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?provider=instagram`);
    } catch (error) {
        console.error('Instagram callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/oauth-error?provider=instagram`);
    }
};

// Twitter OAuth Flow
export const initiateTwitterOAuth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const state = generateState();
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);

        oauthStates.set(state, { userId: req.user.userId, codeVerifier, provider: 'TWITTER' });

        const authUrl = OAuthService.getTwitterAuthUrl(state, codeChallenge);
        res.json({ authUrl });
    } catch (error) {
        console.error('Twitter OAuth initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate Twitter OAuth' });
    }
};

export const handleTwitterCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            res.status(400).json({ error: 'Missing code or state' });
            return;
        }

        const stateData = oauthStates.get(state as string);
        if (!stateData || !stateData.codeVerifier) {
            res.status(400).json({ error: 'Invalid state' });
            return;
        }

        oauthStates.delete(state as string);

        const tokens = await OAuthService.exchangeTwitterCode(code as string, stateData.codeVerifier);
        await OAuthService.storeDataSource(stateData.userId, 'TWITTER', tokens);

        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?provider=twitter`);
    } catch (error) {
        console.error('Twitter callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/oauth-error?provider=twitter`);
    }
};

// Facebook OAuth Flow
export const initiateFacebookOAuth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const state = generateState();
        oauthStates.set(state, { userId: req.user.userId, provider: 'FACEBOOK' });

        const authUrl = OAuthService.getFacebookAuthUrl(state);
        res.json({ authUrl });
    } catch (error) {
        console.error('Facebook OAuth initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate Facebook OAuth' });
    }
};

export const handleFacebookCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            res.status(400).json({ error: 'Missing code or state' });
            return;
        }

        const stateData = oauthStates.get(state as string);
        if (!stateData) {
            res.status(400).json({ error: 'Invalid state' });
            return;
        }

        oauthStates.delete(state as string);

        const tokens = await OAuthService.exchangeFacebookCode(code as string);
        await OAuthService.storeDataSource(stateData.userId, 'FACEBOOK', tokens);

        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?provider=facebook`);
    } catch (error) {
        console.error('Facebook callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/oauth-error?provider=facebook`);
    }
};

// LinkedIn OAuth Flow
export const initiateLinkedInOAuth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const state = generateState();
        oauthStates.set(state, { userId: req.user.userId, provider: 'LINKEDIN' });

        const authUrl = OAuthService.getLinkedInAuthUrl(state);
        res.json({ authUrl });
    } catch (error) {
        console.error('LinkedIn OAuth initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate LinkedIn OAuth' });
    }
};

export const handleLinkedInCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            res.status(400).json({ error: 'Missing code or state' });
            return;
        }

        const stateData = oauthStates.get(state as string);
        if (!stateData) {
            res.status(400).json({ error: 'Invalid state' });
            return;
        }

        oauthStates.delete(state as string);

        const tokens = await OAuthService.exchangeLinkedInCode(code as string);
        await OAuthService.storeDataSource(stateData.userId, 'LINKEDIN', tokens);

        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?provider=linkedin`);
    } catch (error) {
        console.error('LinkedIn callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/oauth-error?provider=linkedin`);
    }
};

// Google OAuth Flow (for Gmail)
export const initiateGoogleOAuth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const state = generateState();
        oauthStates.set(state, { userId: req.user.userId, provider: 'GMAIL' });

        const authUrl = OAuthService.getGoogleAuthUrl(state);
        res.json({ authUrl });
    } catch (error) {
        console.error('Google OAuth initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate Google OAuth' });
    }
};

export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            res.status(400).json({ error: 'Missing code or state' });
            return;
        }

        const stateData = oauthStates.get(state as string);
        if (!stateData) {
            res.status(400).json({ error: 'Invalid state' });
            return;
        }

        oauthStates.delete(state as string);

        const tokens = await OAuthService.exchangeGoogleCode(code as string);
        await OAuthService.storeDataSource(stateData.userId, 'GMAIL', tokens);

        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?provider=google`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/oauth-error?provider=google`);
    }
};

// Microsoft OAuth Flow (for Outlook)
export const initiateMicrosoftOAuth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const state = generateState();
        oauthStates.set(state, { userId: req.user.userId, provider: 'OUTLOOK' });

        const authUrl = OAuthService.getMicrosoftAuthUrl(state);
        res.json({ authUrl });
    } catch (error) {
        console.error('Microsoft OAuth initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate Microsoft OAuth' });
    }
};

export const handleMicrosoftCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            res.status(400).json({ error: 'Missing code or state' });
            return;
        }

        const stateData = oauthStates.get(state as string);
        if (!stateData) {
            res.status(400).json({ error: 'Invalid state' });
            return;
        }

        oauthStates.delete(state as string);

        const tokens = await OAuthService.exchangeMicrosoftCode(code as string);
        await OAuthService.storeDataSource(stateData.userId, 'OUTLOOK', tokens);

        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?provider=microsoft`);
    } catch (error) {
        console.error('Microsoft callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/oauth-error?provider=microsoft`);
    }
};

// Get connected data sources
export const getConnectedDataSources = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const dataSources = await prisma.dataSource.findMany({
            where: { userId: req.user.userId },
            select: {
                id: true,
                type: true,
                status: true,
                providerUsername: true,
                lastSyncAt: true,
                syncCount: true,
                createdAt: true,
            },
        });

        res.json({ dataSources });
    } catch (error) {
        console.error('Get data sources error:', error);
        res.status(500).json({ error: 'Failed to get data sources' });
    }
};

// Disconnect data source
export const disconnectDataSource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { dataSourceId } = req.params;

        await prisma.dataSource.update({
            where: {
                id: dataSourceId,
                userId: req.user.userId,
            },
            data: {
                status: 'DISCONNECTED',
                accessToken: null,
                refreshToken: null,
            },
        });

        res.json({ message: 'Data source disconnected successfully' });
    } catch (error) {
        console.error('Disconnect data source error:', error);
        res.status(500).json({ error: 'Failed to disconnect data source' });
    }
};
