import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class ReferralService {
    /**
     * Generate or retrieve a referral code for a user
     */
    async generateReferralCode(userId: string): Promise<string> {
        try {
            // Check if user already has a code
            const existing = await prisma.referralCode.findUnique({
                where: { userId },
            });

            if (existing) {
                return existing.code;
            }

            // Generate a unique code (e.g., USERNAME123 or random string)
            // For MVP, we'll use a simple random string
            const user = await prisma.user.findUnique({ where: { id: userId } });
            let baseCode = (user?.name || 'USER').substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'USER');
            if (baseCode.length < 3) baseCode = 'USER';

            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            let code = `${baseCode}${randomSuffix}`;

            // Ensure uniqueness
            let isUnique = false;
            while (!isUnique) {
                const check = await prisma.referralCode.findUnique({ where: { code } });
                if (!check) {
                    isUnique = true;
                } else {
                    code = `${baseCode}${Math.floor(1000 + Math.random() * 9000)}`;
                }
            }

            await prisma.referralCode.create({
                data: {
                    userId,
                    code,
                },
            });

            return code;
        } catch (error) {
            logger.error('Error generating referral code:', error);
            throw new Error('Failed to generate referral code');
        }
    }

    /**
     * Process a referral when a new user signs up
     */
    async processReferral(code: string, newUserId: string): Promise<boolean> {
        try {
            const referralCode = await prisma.referralCode.findUnique({
                where: { code },
            });

            if (!referralCode) {
                return false; // Invalid code
            }

            // Prevent self-referral
            if (referralCode.userId === newUserId) {
                return false;
            }

            // Create referral record
            await prisma.referral.create({
                data: {
                    referralCodeId: referralCode.id,
                    referrerId: referralCode.userId,
                    referredUserId: newUserId,
                    status: 'completed', // Or 'pending' if waiting for verification
                },
            });

            // Increment usage count
            await prisma.referralCode.update({
                where: { id: referralCode.id },
                data: { usageCount: { increment: 1 } },
            });

            // Trigger gamification for referrer
            // We'll import dynamically to avoid circular dependency issues if any
            const { gamificationService } = await import('../gamification/gamification.service');
            await gamificationService.checkAchievements(referralCode.userId, 'referral_count');

            return true;
        } catch (error) {
            logger.error('Error processing referral:', error);
            return false;
        }
    }

    /**
     * Get referral stats for a user
     */
    async getReferralStats(userId: string) {
        const referralCode = await prisma.referralCode.findUnique({
            where: { userId },
            include: {
                referrals: {
                    include: { referredUser: { select: { name: true, createdAt: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!referralCode) {
            return {
                code: null,
                totalReferrals: 0,
                referrals: [],
            };
        }

        return {
            code: referralCode.code,
            totalReferrals: referralCode.usageCount,
            referrals: referralCode.referrals.map(r => ({
                user: r.referredUser.name || 'Anonymous',
                date: r.createdAt,
                status: r.status,
            })),
        };
    }
}

export const referralService = new ReferralService();
