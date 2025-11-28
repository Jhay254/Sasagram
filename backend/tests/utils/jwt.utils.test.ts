import { generateAccessToken, generateRefreshToken, verifyToken } from '../../src/utils/jwt.utils';

describe('JWT Utils', () => {
    const testUserId = 'test-user-123';

    describe('generateAccessToken', () => {
        it('should generate a valid access token', () => {
            const token = generateAccessToken(testUserId);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT format
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a valid refresh token', () => {
            const token = generateRefreshToken(testUserId);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid access token', () => {
            const token = generateAccessToken(testUserId);
            const payload = verifyToken(token, 'access');

            expect(payload).toBeDefined();
            expect(payload?.userId).toBe(testUserId);
        });

        it('should verify a valid refresh token', () => {
            const token = generateRefreshToken(testUserId);
            const payload = verifyToken(token, 'refresh');

            expect(payload).toBeDefined();
            expect(payload?.userId).toBe(testUserId);
        });

        it('should return null for invalid token', () => {
            const payload = verifyToken('invalid-token', 'access');

            expect(payload).toBeNull();
        });

        it('should return null for wrong token type', () => {
            const accessToken = generateAccessToken(testUserId);
            const payload = verifyToken(accessToken, 'refresh');

            expect(payload).toBeNull();
        });
    });
});
