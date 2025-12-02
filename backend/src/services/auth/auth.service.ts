import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface TokenPayload {
    id: string;
    email: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export class AuthService {
    /**
     * Register a new user
     */
    async register(email: string, password: string, name?: string) {
        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error('User already exists with this email');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email);

        return { user, ...tokens };
    }

    /**
     * Login user
     */
    async login(email: string, password: string) {
        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
            ...tokens,
        };
    }

    /**
     * Generate access and refresh tokens
     */
    async generateTokens(userId: string, email: string): Promise<AuthTokens> {
        const payload: TokenPayload = { id: userId, email };

        // Generate access token
        const accessToken = jwt.sign(payload, JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });

        // Generate refresh token
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        });

        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });

        return { accessToken, refreshToken };
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken: string) {
        try {
            // Verify refresh token
            const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;

            // Check if token exists in database and is not revoked
            const storedToken = await prisma.refreshToken.findUnique({
                where: { token: refreshToken },
            });

            if (!storedToken || storedToken.revoked) {
                throw new Error('Invalid refresh token');
            }

            // Check if token is expired
            if (new Date() > storedToken.expiresAt) {
                throw new Error('Refresh token expired');
            }

            // Generate new access token
            const accessToken = jwt.sign(
                { id: payload.id, email: payload.email },
                JWT_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            return { accessToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Logout user (revoke refresh token)
     */
    async logout(refreshToken: string) {
        await prisma.refreshToken.updateMany({
            where: { token: refreshToken },
            data: { revoked: true },
        });
    }

    /**
     * Verify access token
     */
    verifyAccessToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    /**
     * Clean up expired refresh tokens (should be run periodically)
     */
    async cleanupExpiredTokens() {
        await prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { revoked: true },
                ],
            },
        });
    }
}

export const authService = new AuthService();
