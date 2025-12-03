"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('Auth Service Unit Tests', () => {
    describe('Password Hashing', () => {
        it('should hash passwords correctly', async () => {
            const password = 'testPassword123';
            const hash = await bcrypt_1.default.hash(password, 10);
            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50);
        });
        it('should verify correct passwords', async () => {
            const password = 'testPassword123';
            const hash = await bcrypt_1.default.hash(password, 10);
            const isValid = await bcrypt_1.default.compare(password, hash);
            expect(isValid).toBe(true);
        });
        it('should reject incorrect passwords', async () => {
            const password = 'testPassword123';
            const wrongPassword = 'wrongPassword456';
            const hash = await bcrypt_1.default.hash(password, 10);
            const isValid = await bcrypt_1.default.compare(wrongPassword, hash);
            expect(isValid).toBe(false);
        });
    });
    describe('JWT Token Generation', () => {
        const secret = 'test-secret';
        const payload = { userId: '123', email: 'test@example.com' };
        it('should generate valid JWT tokens', () => {
            const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '15m' });
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // header.payload.signature
        });
        it('should verify valid tokens', () => {
            const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '15m' });
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
        });
        it('should reject invalid tokens', () => {
            const token = 'invalid.token.here';
            expect(() => {
                jsonwebtoken_1.default.verify(token, secret);
            }).toThrow();
        });
        it('should reject tokens with wrong secret', () => {
            const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '15m' });
            const wrongSecret = 'wrong-secret';
            expect(() => {
                jsonwebtoken_1.default.verify(token, wrongSecret);
            }).toThrow();
        });
        it('should reject expired tokens', () => {
            const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '0s' });
            // Wait a bit to ensure expiration
            return new Promise((resolve) => {
                setTimeout(() => {
                    expect(() => {
                        jsonwebtoken_1.default.verify(token, secret);
                    }).toThrow('jwt expired');
                    resolve(undefined);
                }, 100);
            });
        });
    });
    describe('Email Validation', () => {
        const validEmails = [
            'test@example.com',
            'user.name@example.co.uk',
            'user+tag@example.com',
            'user_name@example-domain.com',
        ];
        const invalidEmails = [
            'invalid',
            '@example.com',
            'user@',
            'user @example.com',
            'user@example',
        ];
        validEmails.forEach(email => {
            it(`should accept valid email: ${email}`, () => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                expect(emailRegex.test(email)).toBe(true);
            });
        });
        invalidEmails.forEach(email => {
            it(`should reject invalid email: ${email}`, () => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                expect(emailRegex.test(email)).toBe(false);
            });
        });
    });
});
