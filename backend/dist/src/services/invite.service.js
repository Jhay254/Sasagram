"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteService = exports.InviteService = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
class InviteService {
    constructor() {
        this.tokenExpiry = '7d'; // 7 days
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    }
    /**
     * Generate invite token for a tag
     */
    generateInviteToken(tagId, email) {
        const payload = {
            tagId,
            email,
        };
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, {
            expiresIn: this.tokenExpiry,
        });
    }
    /**
     * Verify and decode invite token
     */
    verifyInviteToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.jwtSecret);
        }
        catch (error) {
            logger_1.default.warn('Invalid invite token:', error);
            return null;
        }
    }
    /**
     * Get invite data for landing page
     */
    async getInviteData(token) {
        const payload = this.verifyInviteToken(token);
        if (!payload) {
            throw new Error('Invalid or expired invite token');
        }
        // Find the tag (we'll create a pending invitation record if needed)
        const tag = await prisma.eventTag.findFirst({
            where: {
                id: payload.tagId,
            },
            include: {
                tagger: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!tag) {
            throw new Error('Tag not found');
        }
        return {
            event: {
                id: tag.eventId,
                title: tag.eventTitle,
                date: tag.eventDate,
                message: tag.message,
            },
            tagger: tag.tagger,
            invitedEmail: payload.email,
        };
    }
    /**
     * Claim invite and register user
     */
    async claimInvite(token, userData) {
        const payload = this.verifyInviteToken(token);
        if (!payload) {
            throw new Error('Invalid or expired invite token');
        }
        // Verify email matches
        if (payload.email.toLowerCase() !== userData.email.toLowerCase()) {
            throw new Error('Email mismatch - this invite was sent to a different email');
        }
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });
        if (existingUser) {
            throw new Error('User already exists - please log in instead');
        }
        // Hash password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        // Create user
        const newUser = await prisma.user.create({
            data: {
                email: userData.email,
                name: userData.name,
                password: hashedPassword,
            },
        });
        // Update the tag to link to the new user
        const tag = await prisma.eventTag.findFirst({
            where: { id: payload.tagId },
        });
        if (tag) {
            await prisma.eventTag.update({
                where: { id: tag.id },
                data: {
                    taggedUserId: newUser.id,
                    status: 'pending', // User can verify after registration
                },
            });
            logger_1.default.info(`User ${newUser.email} claimed invite for tag ${tag.id}`);
        }
        return {
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
            },
            tag: tag ? {
                id: tag.id,
                eventTitle: tag.eventTitle,
                eventDate: tag.eventDate,
            } : null,
        };
    }
    /**
     * Generate social sharing preview data
     */
    async generateSocialPreview(token) {
        const inviteData = await this.getInviteData(token);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const inviteUrl = `${frontendUrl}/invite/${token}`;
        return {
            url: inviteUrl,
            title: `You're in ${inviteData.tagger.name || inviteData.tagger.email}'s memory!`,
            description: `${inviteData.event.title} - ${new Date(inviteData.event.date).toLocaleDateString()}`,
            image: `${frontendUrl}/og-images/invite-default.png`, // Placeholder
            type: 'website',
        };
    }
}
exports.InviteService = InviteService;
exports.inviteService = new InviteService();
