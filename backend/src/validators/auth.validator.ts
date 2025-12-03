import { z } from 'zod';

/**
 * Authentication Validation Schemas
 */

export const registerSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .max(255, 'Email must be less than 255 characters'),
    password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .max(128, 'Password must be less than 128 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
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
