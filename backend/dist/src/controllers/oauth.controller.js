"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthController = void 0;
const client_1 = require("@prisma/client");
const instagram_service_1 = require("../services/instagram.service");
const twitter_service_1 = require("../services/twitter.service");
const facebook_service_1 = require("../services/facebook.service");
const linkedin_service_1 = require("../services/linkedin.service");
const gmail_service_1 = require("../services/gmail.service");
const outlook_service_1 = require("../services/outlook.service");
const pkce_service_1 = require("../services/pkce.service");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
const instagramService = new instagram_service_1.InstagramService();
const twitterService = new twitter_service_1.TwitterService();
const facebookService = new facebook_service_1.FacebookService();
const linkedInService = new linkedin_service_1.LinkedInService();
const gmailService = new gmail_service_1.GmailService();
const outlookService = new outlook_service_1.OutlookService();
class OAuthController {
    // Instagram OAuth
    async instagramAuth(req, res) {
        try {
            const authUrl = instagramService.getAuthUrl();
            res.redirect(authUrl);
        }
        catch (error) {
            console.error('Instagram auth error:', error);
            res.status(500).json({ error: 'Failed to initiate Instagram authentication' });
        }
    }
    async instagramCallback(req, res) {
        try {
            const { code } = req.query;
            if (!code || typeof code !== 'string') {
                return res.status(400).json({ error: 'Authorization code missing' });
            }
            // Exchange code for token
            const tokenData = await instagramService.exchangeCodeForToken(code);
            // Create or find user (simplified - in production, link to authenticated user)
            let user = await prisma.user.findFirst({
                where: {
                    socialAccounts: {
                        some: {
                            provider: 'INSTAGRAM',
                            providerId: tokenData.user_id.toString(),
                        },
                    },
                },
            });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: `instagram_${tokenData.user_id}@temp.com`, // Temporary email
                        name: 'Instagram User',
                    },
                });
            }
            // Store or update social account
            await prisma.socialAccount.upsert({
                where: {
                    userId_provider: {
                        userId: user.id,
                        provider: 'INSTAGRAM',
                    },
                },
                update: {
                    accessToken: tokenData.access_token,
                    providerId: tokenData.user_id.toString(),
                },
                create: {
                    userId: user.id,
                    provider: 'INSTAGRAM',
                    providerId: tokenData.user_id.toString(),
                    accessToken: tokenData.access_token,
                },
            });
            // Fetch initial media
            await instagramService.fetchMedia(tokenData.access_token, user.id);
            res.json({
                success: true,
                message: 'Instagram connected successfully',
                userId: user.id,
            });
        }
        catch (error) {
            console.error('Instagram callback error:', error);
            res.status(500).json({ error: 'Failed to complete Instagram authentication' });
        }
    }
    // Twitter OAuth
    async twitterAuth(req, res) {
        try {
            const { codeVerifier, codeChallenge } = twitterService.generatePKCE();
            const state = pkce_service_1.pkceService.generateState();
            // Store PKCE in Redis with TTL
            await pkce_service_1.pkceService.store(state, { codeVerifier });
            const authUrl = twitterService.getAuthUrl(codeChallenge, state);
            res.redirect(authUrl);
        }
        catch (error) {
            logger_1.default.error(`Twitter auth error: ${error.message}`);
            res.status(500).json({ error: 'Failed to initiate Twitter authentication' });
        }
    }
    async twitterCallback(req, res) {
        try {
            const { code, state } = req.query;
            if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
                return res.status(400).json({ error: 'Authorization code or state missing' });
            }
            // Retrieve and validate PKCE data (CSRF protection)
            const pkceData = await pkce_service_1.pkceService.retrieve(state);
            if (!pkceData) {
                logger_1.default.warn(`Invalid or expired state parameter: ${state}`);
                return res.status(400).json({ error: 'Invalid or expired state parameter' });
            }
            // Exchange code for token
            const tokenData = await twitterService.exchangeCodeForToken(code, pkceData.codeVerifier);
            // Get Twitter user info
            const twitterUser = await twitterService.getUserInfo(tokenData.access_token);
            // Create or find user
            let user = await prisma.user.findFirst({
                where: {
                    socialAccounts: {
                        some: {
                            provider: 'TWITTER',
                            providerId: twitterUser.id,
                        },
                    },
                },
            });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: `twitter_${twitterUser.id}@temp.com`, // Temporary email
                        name: twitterUser.name,
                    },
                });
            }
            // Store or update social account
            const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
            await prisma.socialAccount.upsert({
                where: {
                    userId_provider: {
                        userId: user.id,
                        provider: 'TWITTER',
                    },
                },
                update: {
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    providerId: twitterUser.id,
                    expiresAt,
                },
                create: {
                    userId: user.id,
                    provider: 'TWITTER',
                    providerId: twitterUser.id,
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expiresAt,
                },
            });
            // Fetch initial tweets
            await twitterService.fetchTweets(tokenData.access_token, twitterUser.id, user.id);
            logger_1.default.info(`Twitter connected successfully for user: ${user.id}`);
            res.json({
                success: true,
                message: 'Twitter connected successfully',
                userId: user.id,
            });
        }
        catch (error) {
            logger_1.default.error(`Twitter callback error: ${error.message}`);
            res.status(500).json({ error: 'Failed to complete Twitter authentication' });
        }
    }
    // Facebook OAuth
    async facebookAuth(req, res) {
        try {
            const authUrl = facebookService.getAuthUrl();
            res.redirect(authUrl);
        }
        catch (error) {
            console.error('Facebook auth error:', error);
            res.status(500).json({ error: 'Failed to initiate Facebook authentication' });
        }
    }
    async facebookCallback(req, res) {
        try {
            const { code } = req.query;
            if (!code || typeof code !== 'string') {
                return res.status(400).json({ error: 'Authorization code missing' });
            }
            const tokenData = await facebookService.exchangeCodeForToken(code);
            const fbUser = await facebookService.getUserInfo(tokenData.access_token);
            let user = await prisma.user.findFirst({
                where: {
                    socialAccounts: {
                        some: {
                            provider: 'FACEBOOK',
                            providerId: fbUser.id,
                        },
                    },
                },
            });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: fbUser.email || `facebook_${fbUser.id}@temp.com`,
                        name: fbUser.name,
                    },
                });
            }
            await prisma.socialAccount.upsert({
                where: {
                    userId_provider: {
                        userId: user.id,
                        provider: 'FACEBOOK',
                    },
                },
                update: {
                    accessToken: tokenData.access_token,
                    providerId: fbUser.id,
                },
                create: {
                    userId: user.id,
                    provider: 'FACEBOOK',
                    providerId: fbUser.id,
                    accessToken: tokenData.access_token,
                },
            });
            await facebookService.fetchPosts(tokenData.access_token, user.id);
            res.json({
                success: true,
                message: 'Facebook connected successfully',
                userId: user.id,
            });
        }
        catch (error) {
            console.error('Facebook callback error:', error);
            res.status(500).json({ error: 'Failed to complete Facebook authentication' });
        }
    }
    // LinkedIn OAuth
    async linkedinAuth(req, res) {
        try {
            const authUrl = linkedInService.getAuthUrl();
            res.redirect(authUrl);
        }
        catch (error) {
            console.error('LinkedIn auth error:', error);
            res.status(500).json({ error: 'Failed to initiate LinkedIn authentication' });
        }
    }
    async linkedinCallback(req, res) {
        try {
            const { code } = req.query;
            if (!code || typeof code !== 'string') {
                return res.status(400).json({ error: 'Authorization code missing' });
            }
            const tokenData = await linkedInService.exchangeCodeForToken(code);
            const linkedInUser = await linkedInService.getUserInfo(tokenData.access_token);
            let user = await prisma.user.findFirst({
                where: {
                    socialAccounts: {
                        some: {
                            provider: 'LINKEDIN',
                            providerId: linkedInUser.sub,
                        },
                    },
                },
            });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: linkedInUser.email || `linkedin_${linkedInUser.sub}@temp.com`,
                        name: linkedInUser.name,
                    },
                });
            }
            await prisma.socialAccount.upsert({
                where: {
                    userId_provider: {
                        userId: user.id,
                        provider: 'LINKEDIN',
                    },
                },
                update: {
                    accessToken: tokenData.access_token,
                    providerId: linkedInUser.sub,
                },
                create: {
                    userId: user.id,
                    provider: 'LINKEDIN',
                    providerId: linkedInUser.sub,
                    accessToken: tokenData.access_token,
                },
            });
            await linkedInService.fetchPosts(tokenData.access_token, user.id);
            res.json({
                success: true,
                message: 'LinkedIn connected successfully',
                userId: user.id,
            });
        }
        catch (error) {
            console.error('LinkedIn callback error:', error);
            res.status(500).json({ error: 'Failed to complete LinkedIn authentication' });
        }
    }
    // Gmail OAuth
    async gmailAuth(req, res) {
        try {
            const authUrl = gmailService.getAuthUrl();
            res.redirect(authUrl);
        }
        catch (error) {
            console.error('Gmail auth error:', error);
            res.status(500).json({ error: 'Failed to initiate Gmail authentication' });
        }
    }
    async gmailCallback(req, res) {
        try {
            const { code } = req.query;
            if (!code || typeof code !== 'string') {
                return res.status(400).json({ error: 'Authorization code missing' });
            }
            const tokenData = await gmailService.exchangeCodeForToken(code);
            const userEmail = await gmailService.getUserEmail(tokenData.access_token);
            let user = await prisma.user.findUnique({
                where: { email: userEmail },
            });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: userEmail,
                        name: userEmail.split('@')[0],
                    },
                });
            }
            await prisma.socialAccount.upsert({
                where: {
                    userId_provider: {
                        userId: user.id,
                        provider: 'GMAIL',
                    },
                },
                update: {
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    providerId: userEmail,
                },
                create: {
                    userId: user.id,
                    provider: 'GMAIL',
                    providerId: userEmail,
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                },
            });
            await gmailService.fetchEmails(tokenData.access_token, tokenData.refresh_token, user.id);
            res.json({
                success: true,
                message: 'Gmail connected successfully',
                userId: user.id,
            });
        }
        catch (error) {
            console.error('Gmail callback error:', error);
            res.status(500).json({ error: 'Failed to complete Gmail authentication' });
        }
    }
    // Outlook OAuth
    async outlookAuth(req, res) {
        try {
            const authUrl = outlookService.getAuthUrl();
            res.redirect(authUrl);
        }
        catch (error) {
            console.error('Outlook auth error:', error);
            res.status(500).json({ error: 'Failed to initiate Outlook authentication' });
        }
    }
    async outlookCallback(req, res) {
        try {
            const { code } = req.query;
            if (!code || typeof code !== 'string') {
                return res.status(400).json({ error: 'Authorization code missing' });
            }
            const tokenData = await outlookService.exchangeCodeForToken(code);
            const outlookUser = await outlookService.getUserInfo(tokenData.access_token);
            let user = await prisma.user.findUnique({
                where: { email: outlookUser.mail },
            });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: outlookUser.mail,
                        name: outlookUser.displayName,
                    },
                });
            }
            await prisma.socialAccount.upsert({
                where: {
                    userId_provider: {
                        userId: user.id,
                        provider: 'OUTLOOK',
                    },
                },
                update: {
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    providerId: outlookUser.mail,
                },
                create: {
                    userId: user.id,
                    provider: 'OUTLOOK',
                    providerId: outlookUser.mail,
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                },
            });
            await outlookService.fetchEmails(tokenData.access_token, user.id);
            res.json({
                success: true,
                message: 'Outlook connected successfully',
                userId: user.id,
            });
        }
        catch (error) {
            console.error('Outlook callback error:', error);
            res.status(500).json({ error: 'Failed to complete Outlook authentication' });
        }
    }
}
exports.OAuthController = OAuthController;
