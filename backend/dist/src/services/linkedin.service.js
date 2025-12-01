"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedInService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const media_service_1 = require("./media.service");
const prisma = new client_1.PrismaClient();
const mediaService = new media_service_1.MediaService();
// Note: LinkedIn API structure varies significantly based on version and permissions.
// This assumes usage of the UGC (User Generated Content) or Shares API if available.
// For basic "Sign In with LinkedIn", post access is very limited.
class LinkedInService {
    constructor() {
        this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
        this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
        this.redirectUri = process.env.LINKEDIN_REDIRECT_URI || '';
    }
    getAuthUrl() {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            state: 'linkedin_auth_state',
            scope: 'openid profile email', // Add 'w_member_social' if approved for posting/reading shares
        });
        return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }
    async exchangeCodeForToken(code) {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            client_secret: this.clientSecret,
        });
        const response = await axios_1.default.post('https://www.linkedin.com/oauth/v2/accessToken', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
    async getUserInfo(accessToken) {
        const response = await axios_1.default.get('https://api.linkedin.com/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    }
    async refreshToken(refreshToken) {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.clientId,
            client_secret: this.clientSecret,
        });
        const response = await axios_1.default.post('https://www.linkedin.com/oauth/v2/accessToken', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
    async fetchPosts(accessToken, userId) {
        // NOTE: Standard LinkedIn API access (Sign In with LinkedIn) does NOT allow fetching user posts.
        // This requires the "Share on LinkedIn" or "Marketing Developer Platform" products.
        // We will implement a placeholder that logs this limitation or attempts to fetch if scope allows.
        console.log('Fetching LinkedIn posts (requires w_member_social scope)...');
        try {
            // This endpoint is for UGC posts, might fail without proper permissions
            // Using a generic structure as placeholder
            /*
            const response = await axios.get('https://api.linkedin.com/v2/ugcPosts', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { q: 'authors', authors: `List(${userId})` }
            });
            */
            // For MVP/Basic access, we might just skip this or log a message
            console.log('LinkedIn post fetching skipped (requires advanced permissions)');
        }
        catch (error) {
            console.error('Error fetching LinkedIn posts:', error);
        }
    }
}
exports.LinkedInService = LinkedInService;
