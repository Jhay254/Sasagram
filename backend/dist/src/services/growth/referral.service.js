"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralService = exports.ReferralService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
class ReferralService {
    /**
     * Generate or retrieve a referral code for a user
     */
    async generateReferralCode(userId) {
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
            if (baseCode.length < 3)
                baseCode = 'USER';
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            let code = `${baseCode}${randomSuffix}`;
            // Ensure uniqueness
            let isUnique = false;
            while (!isUnique) {
                const check = await prisma.referralCode.findUnique({ where: { code } });
                if (!check) {
                    isUnique = true;
                }
                else {
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
        }
        catch (error) {
            logger_1.default.error('Error generating referral code:', error);
            throw new Error('Failed to generate referral code');
        }
    }
    /**
     * Process a referral when a new user signs up
     */
    async processReferral(code, newUserId) {
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
            const { gamificationService } = await Promise.resolve().then(() => __importStar(require('../gamification/gamification.service')));
            await gamificationService.checkAchievements(referralCode.userId, 'referral_count');
            return true;
        }
        catch (error) {
            logger_1.default.error('Error processing referral:', error);
            return false;
        }
    }
    /**
     * Get referral stats for a user
     */
    async getReferralStats(userId) {
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
exports.ReferralService = ReferralService;
exports.referralService = new ReferralService();
