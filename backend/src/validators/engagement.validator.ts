import { z } from 'zod';

export const createChapterSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    location: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
});

export const updateChapterSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const addPermissionSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    accessLevel: z.enum(['VIEW', 'EDIT', 'ADMIN']),
});
