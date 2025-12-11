import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export class CreatorService {
    /**
     * Onboard a user as a creator
     */
    async onboardCreator(userId: string, data: {
        username: string;
        displayName: string;
        bio: string;
        categories: string[];
    }) {
        // Check if username is taken
        const existingUser = await prisma.user.findUnique({
            where: { username: data.username },
        });

        if (existingUser && existingUser.id !== userId) {
            throw new Error('Username is already taken');
        }

        // Update user role and profile
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                role: UserRole.CREATOR,
                username: data.username,
                displayName: data.displayName,
                bio: data.bio,
                categories: data.categories,
                // Create default tiers
                createdTiers: {
                    create: [
                        {
                            name: 'Free Follower',
                            price: 0,
                            currency: 'USD',
                            features: JSON.stringify(['Access to public posts', 'Basic community access']),
                            isActive: true,
                        },
                        {
                            name: 'Premium Supporter',
                            price: 4.99,
                            currency: 'USD',
                            features: JSON.stringify(['Exclusive chapters', 'Direct messaging', 'Supporter badge']),
                            isActive: true,
                        },
                    ],
                },
            },
            include: {
                createdTiers: true,
            },
        });

        return user;
    }
}

export const creatorService = new CreatorService();
