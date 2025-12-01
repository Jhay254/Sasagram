"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenRefreshService = void 0;
const client_1 = require("@prisma/client");
const instagram_service_1 = require("./instagram.service");
const twitter_service_1 = require("./twitter.service");
const facebook_service_1 = require("./facebook.service");
const linkedin_service_1 = require("./linkedin.service");
const gmail_service_1 = require("./gmail.service");
const outlook_service_1 = require("./outlook.service");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
class TokenRefreshService {
    constructor() {
        this.instagramService = new instagram_service_1.InstagramService();
        this.twitterService = new twitter_service_1.TwitterService();
        this.facebookService = new facebook_service_1.FacebookService();
        this.linkedinService = new linkedin_service_1.LinkedInService();
        this.gmailService = new gmail_service_1.GmailService();
        this.outlookService = new outlook_service_1.OutlookService();
    }
    /**
     * Check for expiring tokens and refresh them
     */
    async refreshAllTokens() {
        logger_1.default.info('Starting token refresh cycle...');
        // Find tokens expiring in the next 24 hours
        const expiringThreshold = new Date();
        expiringThreshold.setHours(expiringThreshold.getHours() + 24);
        const accounts = await prisma.socialAccount.findMany({
            where: {
                expiresAt: {
                    lt: expiringThreshold,
                },
            },
        });
        logger_1.default.info(`Found ${accounts.length} accounts with expiring tokens`);
        for (const account of accounts) {
            try {
                await this.refreshAccountToken(account);
            }
            catch (error) {
                logger_1.default.error(`Failed to refresh token for account ${account.id} (${account.provider}): ${error.message}`);
            }
        }
        logger_1.default.info('Token refresh cycle completed');
    }
    async refreshAccountToken(account) {
        logger_1.default.info(`Refreshing token for ${account.provider} account: ${account.platformUsername}`);
        let newTokens = null;
        switch (account.provider) {
            case 'INSTAGRAM':
                // Instagram Long-Lived tokens last 60 days and can be refreshed
                newTokens = await this.instagramService.refreshToken(account.accessToken);
                break;
            case 'TWITTER':
                if (account.refreshToken) {
                    // Twitter V2 OAuth tokens expire in 2 hours, need refresh token
                    newTokens = await this.twitterService.refreshToken(account.refreshToken);
                }
                break;
            case 'FACEBOOK':
                // Facebook Long-Lived tokens last 60 days
                newTokens = await this.facebookService.refreshToken(account.accessToken);
                break;
            case 'GMAIL':
                if (account.refreshToken) {
                    // Google tokens need refresh
                    const gmailTokens = await this.gmailService.refreshToken(account.refreshToken);
                    newTokens = {
                        access_token: gmailTokens.access_token,
                        refresh_token: gmailTokens.refresh_token,
                        expires_in: Math.floor((gmailTokens.expiry_date - Date.now()) / 1000),
                    };
                }
                break;
            case 'OUTLOOK':
                if (account.refreshToken) {
                    // Microsoft tokens need refresh
                    newTokens = await this.outlookService.refreshToken(account.refreshToken);
                }
                break;
            case 'LINKEDIN':
                if (account.refreshToken) {
                    // LinkedIn tokens need refresh
                    newTokens = await this.linkedinService.refreshToken(account.refreshToken);
                }
                break;
            default:
                logger_1.default.warn(`No refresh logic for provider: ${account.provider}`);
        }
        if (newTokens) {
            await prisma.socialAccount.update({
                where: { id: account.id },
                data: {
                    accessToken: newTokens.access_token,
                    refreshToken: newTokens.refresh_token || account.refreshToken,
                    expiresAt: new Date(Date.now() + (newTokens.expires_in * 1000)),
                },
            });
            logger_1.default.info(`Successfully refreshed token for ${account.provider}`);
        }
    }
}
exports.TokenRefreshService = TokenRefreshService;
