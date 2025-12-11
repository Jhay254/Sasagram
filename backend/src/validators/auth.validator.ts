import { z } from 'zod';

/**
 * Authentication Validation Schemas
 */

export const registerSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .max(255, 'Email must be less than 255 characters'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters'),
    name: z.string()
        .max(255, 'Name must be less than 255 characters')
        .optional()
});

export const loginSchema = z.object({
    email: z.string()
        .email('Invalid email format'),
    password: z.string()
        .min(1, 'Password is required')
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string()
        .min(1, 'Refresh token is required')
});
