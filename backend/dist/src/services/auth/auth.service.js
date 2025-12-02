"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
class AuthService {
    /**
     * Register a new user
     */
    async register(email, password, name) {
        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error('User already exists with this email');
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
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
    async login(email, password) {
        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }
        // Verify password
        const isValid = await bcrypt_1.default.compare(password, user.password);
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
    async generateTokens(userId, email) {
        const payload = { id: userId, email };
        // Generate access token
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });
        // Generate refresh token
        const refreshToken = jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, {
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
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const payload = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
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
            const accessToken = jsonwebtoken_1.default.sign({ id: payload.id, email: payload.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
            return { accessToken };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    /**
     * Logout user (revoke refresh token)
     */
    async logout(refreshToken) {
        await prisma.refreshToken.updateMany({
            where: { token: refreshToken },
            data: { revoked: true },
        });
    }
    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
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
exports.AuthService = AuthService;
exports.authService = new AuthService();
