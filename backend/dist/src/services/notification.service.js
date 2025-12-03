"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class NotificationService {
    constructor() {
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    }
    /**
     * Send tag notification to user
     */
    async sendTagNotification(tagId) {
        const tag = await prisma.eventTag.findUnique({
            where: { id: tagId },
            include: {
                tagger: true,
                taggedUser: true,
            },
        });
        if (!tag) {
            logger_1.default.warn(`Tag ${tagId} not found for notification`);
            return;
        }
        const email = this.buildTagNotificationEmail(tag);
        await this.sendEmail(tag.taggedUser.email, email);
        logger_1.default.info(`Tag notification sent to ${tag.taggedUser.email}`, {
            tagId,
            tagger: tag.tagger.email,
            event: tag.eventTitle,
        });
    }
    /**
     * Send invitation to non-user
     */
    async sendInviteNotification(taggerId, email, eventData, inviteToken) {
        const tagger = await prisma.user.findUnique({ where: { id: taggerId } });
        if (!tagger) {
            logger_1.default.warn(`Tagger ${taggerId} not found for invite`);
            return;
        }
        const emailTemplate = this.buildInviteEmail(tagger, eventData, inviteToken);
        await this.sendEmail(email, emailTemplate);
        logger_1.default.info(`Invite notification sent to ${email}`, {
            from: tagger.email,
            event: eventData.eventTitle,
        });
    }
    /**
     * Build tag notification email
     */
    buildTagNotificationEmail(tag) {
        const taggerName = tag.tagger.name || tag.tagger.email;
        const viewLink = `${this.frontendUrl}/tags/pending`;
        return {
            subject: `${taggerName} tagged you in a memory!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .event-details { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📸 You're in a Memory!</h1>
                        </div>
                        <div class="content">
                            <p>Hi there!</p>
                            <p><strong>${taggerName}</strong> tagged you in a shared memory:</p>
                            <div class="event-details">
                                <h3>${tag.eventTitle}</h3>
                                <p>📅 ${new Date(tag.eventDate).toLocaleDateString()}</p>
                                ${tag.message ? `<p>💬 "${tag.message}"</p>` : ''}
                            </div>
                            <p>Verify this memory and add your perspective to strengthen your connection!</p>
                            <a href="${viewLink}" class="button">View & Verify Memory</a>
                            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                                This is an automated message from Lifeline. If you didn't expect this, you can safely ignore it.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
${taggerName} tagged you in a memory!

Event: ${tag.eventTitle}
Date: ${new Date(tag.eventDate).toLocaleDateString()}
${tag.message ? `Message: "${tag.message}"` : ''}

View and verify this memory at: ${viewLink}
            `.trim(),
        };
    }
    /**
     * Build invite email for non-users
     */
    buildInviteEmail(tagger, eventData, inviteToken) {
        const taggerName = tagger.name || tagger.email;
        const claimLink = `${this.frontendUrl}/invite/${inviteToken}`;
        return {
            subject: `You're in ${taggerName}'s memory on Lifeline!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .event-details { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                        .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 You're Part of a Memory!</h1>
                        </div>
                        <div class="content">
                            <p>Hi!</p>
                            <p><strong>${taggerName}</strong> remembers you from this moment:</p>
                            <div class="event-details">
                                <h3>${eventData.eventTitle}</h3>
                                <p>📅 ${new Date(eventData.eventDate).toLocaleDateString()}</p>
                            </div>
                            <div class="highlight">
                                <p><strong>✨ Claim Your Memory</strong></p>
                                <p>Join Lifeline to verify this memory, add your perspective, and discover more shared moments!</p>
                            </div>
                            <a href="${claimLink}" class="button">Claim Your Memory</a>
                            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                                Lifeline helps you preserve and share life's moments. This invitation expires in 7 days.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
You're part of ${taggerName}'s memory on Lifeline!

Event: ${eventData.eventTitle}
Date: ${new Date(eventData.eventDate).toLocaleDateString()}

Claim your memory and join Lifeline at: ${claimLink}

This invitation expires in 7 days.
            `.trim(),
        };
    }
    /**
     * Send email (placeholder - integrate with real email service)
     */
    async sendEmail(to, template) {
        // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
        // For now, just log the email
        logger_1.default.info('Email would be sent:', {
            to,
            subject: template.subject,
            preview: template.text.substring(0, 100) + '...',
        });
        // Uncomment when email service is configured:
        /*
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@lifeline.app',
            to,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });
        */
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
