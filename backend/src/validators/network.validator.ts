import { z } from 'zod';

export const connectionSchema = z.object({
    otherUserId: z.string().uuid('Invalid user ID'),
    relationshipType: z.enum(['friend', 'family', 'colleague', 'partner', 'other']).optional(),
});

export const collisionDetectionSchema = z.object({}); // Empty body expected

export const relationshipTimelineSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
});
