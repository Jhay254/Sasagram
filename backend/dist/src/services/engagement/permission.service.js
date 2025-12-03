"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionService = exports.PermissionService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
class PermissionService {
    /**
     * Grant permission to a user for a chapter
     */
    async grantPermission(chapterId, userId, role, grantedBy) {
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
                    ...(chapter.content ? JSON.parse(chapter.content) : {}),
                    _permissions: permissions,
                }),
            },
        });
        logger_1.default.info(`Permission granted`, { chapterId, userId, role });
        return { success: true, userId, role };
    }
    /**
     * Revoke permission from a user
     */
    async revokePermission(chapterId, userId, revokedBy) {
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
                    ...(chapter.content ? JSON.parse(chapter.content) : {}),
                    _permissions: permissions,
                }),
            },
        });
        logger_1.default.info(`Permission revoked`, { chapterId, userId });
        return { success: true, userId };
    }
    /**
     * Check if user has permission for an action
     */
    async checkPermission(chapterId, userId, action) {
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
        const permissionMatrix = {
            owner: ['read', 'write', 'delete', 'manage'],
            editor: ['read', 'write'],
            viewer: ['read'],
        };
        return permissionMatrix[role]?.includes(action) || false;
    }
    /**
     * Get all permissions for a chapter
     */
    async getChapterPermissions(chapterId) {
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
        const result = {
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
    parsePermissions(chapter) {
        try {
            const content = chapter.content ? JSON.parse(chapter.content) : {};
            return content._permissions || {};
        }
        catch {
            return {};
        }
    }
}
exports.PermissionService = PermissionService;
exports.permissionService = new PermissionService();
