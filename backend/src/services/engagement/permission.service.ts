import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

type Role = 'owner' | 'editor' | 'viewer';
type Action = 'read' | 'write' | 'delete' | 'manage';

export class PermissionService {
    /**
     * Grant permission to a user for a chapter
     */
    async grantPermission(
        chapterId: string,
        userId: string,
        role: Role,
        grantedBy: string
    ): Promise<any> {
        const chapter = await prisma.livingChapter.findUnique({
            where: { id: chapterId },
        });

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        // Verify granter has manage permission
        const canManage = await this.checkPermission(chapterId, grantedBy, 'manage');
        if (!canManage) {
            throw new Error('Unauthorized: You cannot manage permissions for this chapter');
        }

        // Get existing permissions
        const permissions = this.parsePermissions(chapter);

        // Add new permission
        permissions[userId] = {
            role,
            grantedBy,
            grantedAt: new Date().toISOString(),
        };

        // Update chapter
        await prisma.livingChapter.update({
            where: { id: chapterId },
            data: {
                content: JSON.stringify({
                    ...(chapter.content ? JSON.parse(chapter.content as string) : {}),
                    _permissions: permissions,
                }),
            },
        });

        logger.info(`Permission granted`, { chapterId, userId, role });

        return { success: true, userId, role };
    }

    /**
     * Revoke permission from a user
     */
    async revokePermission(
        chapterId: string,
        userId: string,
        revokedBy: string
    ): Promise<any> {
        const chapter = await prisma.livingChapter.findUnique({
            where: { id: chapterId },
        });

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        // Verify revoker has manage permission
        const canManage = await this.checkPermission(chapterId, revokedBy, 'manage');
        if (!canManage) {
            throw new Error('Unauthorized');
        }

        // Cannot revoke owner permission
        if (userId === chapter.userId) {
            throw new Error('Cannot revoke owner permission');
        }

        // Get existing permissions
        const permissions = this.parsePermissions(chapter);

        // Remove permission
        delete permissions[userId];

        // Update chapter
        await prisma.livingChapter.update({
            where: { id: chapterId },
            data: {
                content: JSON.stringify({
                    ...(chapter.content ? JSON.parse(chapter.content as string) : {}),
                    _permissions: permissions,
                }),
            },
        });

        logger.info(`Permission revoked`, { chapterId, userId });

        return { success: true, userId };
    }

    /**
     * Check if user has permission for an action
     */
    async checkPermission(
        chapterId: string,
        userId: string,
        action: Action
    ): Promise<boolean> {
        const chapter = await prisma.livingChapter.findUnique({
            where: { id: chapterId },
        });

        if (!chapter) {
            return false;
        }

        // Owner has all permissions
        if (chapter.userId === userId) {
            return true;
        }

        const permissions = this.parsePermissions(chapter);
        const userPermission = permissions[userId];

        if (!userPermission) {
            return false;
        }

        const role = userPermission.role;

        // Permission matrix
        const permissionMatrix: Record<Role, Action[]> = {
            owner: ['read', 'write', 'delete', 'manage'],
            editor: ['read', 'write'],
            viewer: ['read'],
        };

        return permissionMatrix[role]?.includes(action) || false;
    }

    /**
     * Get all permissions for a chapter
     */
    async getChapterPermissions(chapterId: string): Promise<any> {
        const chapter = await prisma.livingChapter.findUnique({
            where: { id: chapterId },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        const permissions = this.parsePermissions(chapter);

        // Add owner
        const result: any = {
            [chapter.userId]: {
                role: 'owner',
                user: chapter.user,
            },
        };

        // Add other permissions
        for (const [userId, perm] of Object.entries(permissions)) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, email: true },
            });

            result[userId] = {
                ...perm,
                user,
            };
        }

        return result;
    }

    /**
     * Parse permissions from chapter content
     */
    private parsePermissions(chapter: any): Record<string, any> {
        try {
            const content = chapter.content ? JSON.parse(chapter.content as string) : {};
            return content._permissions || {};
        } catch {
            return {};
        }
    }
}

export const permissionService = new PermissionService();
