import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminService {
    async getSystemStats() {
        const totalUsers = await prisma.user.count();
        const totalCreators = await prisma.user.count({
            where: { role: UserRole.CREATOR },
        });

        // Mock revenue for now as we don't have a transaction table fully populated/linked yet
        const totalRevenue = totalCreators * 100; // Mock calculation

        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return {
            totalUsers,
            totalCreators,
            totalRevenue,
            recentUsers,
        };
    }

    async getUsers(page: number = 1, limit: number = 10, search?: string) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async updateUserRole(userId: string, role: UserRole) {
        return prisma.user.update({
            where: { id: userId },
            data: { role },
        });
    }
}

export const adminService = new AdminService();
