"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../../src/services/auth.service");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock dependencies
jest.mock('@prisma/client', () => {
    const mPrismaClient = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        refreshToken: {
            create: jest.fn(),
        },
    };
    return { PrismaClient: jest.fn(() => mPrismaClient) };
});
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
describe('AuthService', () => {
    let authService;
    let prisma;
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        authService = new auth_service_1.AuthService();
        // Access the mocked prisma instance
        prisma = authService.prisma;
    });
    describe('register', () => {
        it('should register a new user successfully', async () => {
            const email = 'test@example.com';
            const password = 'Password123!';
            const name = 'Test User';
            const hashedPassword = 'hashedPassword';
            const userId = 'user-123';
            const token = 'jwt-token';
            const refreshToken = 'refresh-token';
            // Mock bcrypt
            bcrypt_1.default.hash.mockResolvedValue(hashedPassword);
            // Mock Prisma findUnique (user does not exist)
            prisma.user.findUnique.mockResolvedValue(null);
            // Mock Prisma create
            prisma.user.create.mockResolvedValue({
                id: userId,
                email,
                name,
                password: hashedPassword,
            });
            // Mock jwt
            jsonwebtoken_1.default.sign
                .mockReturnValueOnce(token) // Access token
                .mockReturnValueOnce(refreshToken); // Refresh token
            // Mock RefreshToken create
            prisma.refreshToken.create.mockResolvedValue({
                token: refreshToken,
                userId,
            });
            const result = await authService.register(email, password, name);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
            expect(bcrypt_1.default.hash).toHaveBeenCalledWith(password, 10);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                },
            });
            expect(result).toEqual({
                user: {
                    id: userId,
                    email,
                    name,
                },
                token,
                refreshToken,
            });
        });
        it('should throw error if user already exists', async () => {
            const email = 'existing@example.com';
            const password = 'Password123!';
            // Mock Prisma findUnique (user exists)
            prisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email });
            await expect(authService.register(email, password)).rejects.toThrow('User already exists');
            expect(prisma.user.create).not.toHaveBeenCalled();
        });
    });
});
