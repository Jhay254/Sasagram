"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRES_IN = 7; // 7 days
class AuthService {
    /**
     * Register a new user
     */
    async register(email, password, name) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });
        const tokens = await this.generateTokens(user.id);
        return { user, tokens };
    }
    /**
     * Login user
     */
    async login(email, password) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        const tokens = await this.generateTokens(user.id);
        return { user, tokens };
    }
    /**
     * Refresh access token
     */
    async refreshToken(token) {
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!storedToken || storedToken.revoked) {
            throw new Error('Invalid refresh token');
        }
        if (new Date() > storedToken.expiresAt) {
            // Revoke expired token
            await prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { revoked: true },
            });
            throw new Error('Refresh token expired');
        }
        // Revoke the used refresh token (Rotation)
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true },
        });
        // Generate new tokens
        return this.generateTokens(storedToken.userId);
    }
    /**
     * Logout (revoke refresh token)
     */
    async logout(token) {
        await prisma.refreshToken.update({
            where: { token },
            data: { revoked: true },
        });
    }
    /**
     * Generate Access and Refresh tokens
     */
    async generateTokens(userId) {
        // Generate Access Token
        const accessToken = jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
        // Generate Refresh Token
        const refreshToken = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN);
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
}
exports.AuthService = AuthService;
