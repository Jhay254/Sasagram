import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@lifeline.app',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        console.log(`✉️ Email sent to ${options.to}`);
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

export const sendVerificationEmail = async (
    email: string,
    token: string
): Promise<void> => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Welcome to Lifeline! 🎉</h1>
      <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" 
         style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Verify Email
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
      <p style="color: #999; font-size: 12px; margin-top: 40px;">
        This link will expire in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    </div>
  `;

    await sendEmail({
        to: email,
        subject: 'Verify your Lifeline account',
        html,
    });
};

export const sendPasswordResetEmail = async (
    email: string,
    token: string
): Promise<void> => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Password Reset Request</h1>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}" 
         style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Reset Password
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p style="color: #999; font-size: 12px; margin-top: 40px;">
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      </p>
    </div>
  `;

    await sendEmail({
        to: email,
        subject: 'Reset your Lifeline password',
        html,
    });
};
