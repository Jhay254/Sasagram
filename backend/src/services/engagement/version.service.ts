import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

interface ChapterVersion {
    id: string;
    chapterId: string;
    title: string;
    content: string;
    createdBy: string;
    createdAt: string;
    changeDescription?: string;
}

export class VersionService {
    private readonly MAX_VERSIONS = 10;

    /**
     * Create a new version snapshot
     */
    async createVersion(
        chapterId: string,
        userId: string,
        changeDescription?: string
    ): Promise<ChapterVersion> {
        const chapter = await prisma.livingChapter.findUnique({
            where: { id: chapterId },
        });

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        const versions = this.parseVersions(chapter);

        // Create new version
        const newVersion: ChapterVersion = {
            id: `v-${Date.now()}`,
            chapterId,
            title: chapter.title,
            content: chapter.content || '',
            createdBy: userId,
            createdAt: new Date().toISOString(),
            changeDescription,
        };

        // Add to versions array
        versions.unshift(newVersion);

        // Keep only last MAX_VERSIONS
        const trimmedVersions = versions.slice(0, this.MAX_VERSIONS);

        // Update chapter
        await this.saveVersions(chapterId, trimmedVersions);

        logger.info(`Version created for chapter ${chapterId}`, {
            versionId: newVersion.id,
            userId,
        });

        return newVersion;
    }

    /**
     * Get version history for a chapter
     */
    async getVersionHistory(chapterId: string): Promise<ChapterVersion[]> {
        const chapter = await prisma.livingChapter.findUnique({
            where: { id: chapterId },
        });

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        return this.parseVersions(chapter);
    }

    /**
     * Get a specific version
     */
    async getVersion(chapterId: string, versionId: string): Promise<ChapterVersion | null> {
        const versions = await this.getVersionHistory(chapterId);
        return versions.find(v => v.id === versionId) || null;
    }

    /**
     * Revert chapter to a specific version
     */
    async revertToVersion(
        chapterId: string,
        versionId: string,
        userId: string
    ): Promise<any> {
        const version = await this.getVersion(chapterId, versionId);

        if (!version) {
            throw new Error('Version not found');
        }

        // Create a version of current state before reverting
        await this.createVersion(chapterId, userId, `Reverting to version ${versionId}`);

        // Revert chapter
        await prisma.livingChapter.update({
            where: { id: chapterId },
            data: {
                title: version.title,
                content: version.content,
            },
        });

        logger.info(`Chapter reverted to version ${versionId}`, {
            chapterId,
            userId,
        });

        return { success: true, versionId };
    }

    /**
     * Compare two versions
     */
    async compareVersions(
        chapterId: string,
        versionId1: string,
        versionId2: string
    ): Promise<any> {
        const version1 = await this.getVersion(chapterId, versionId1);
        const version2 = await this.getVersion(chapterId, versionId2);

        if (!version1 || !version2) {
            throw new Error('One or both versions not found');
        }

        return {
            version1: {
                id: version1.id,
                title: version1.title,
                createdAt: version1.createdAt,
                createdBy: version1.createdBy,
            },
            version2: {
                id: version2.id,
                title: version2.title,
                createdAt: version2.createdAt,
                createdBy: version2.createdBy,
            },
            changes: {
                titleChanged: version1.title !== version2.title,
                contentChanged: version1.content !== version2.content,
            },
        };
    }

    /**
     * Parse versions from chapter content
     */
    private parseVersions(chapter: any): ChapterVersion[] {
        try {
            const content = chapter.content ? JSON.parse(chapter.content as string) : {};
            return content._versions || [];
        } catch {
            return [];
        }
    }

    /**
     * Save versions to chapter content
     */
    private async saveVersions(chapterId: string, versions: ChapterVersion[]): Promise<void> {
        const chapter = await prisma.livingChapter.findUnique({
            where: { id: chapterId },
        });

        if (!chapter) return;

        const content = chapter.content ? JSON.parse(chapter.content as string) : {};
        content._versions = versions;

        await prisma.livingChapter.update({
            where: { id: chapterId },
            data: {
                content: JSON.stringify(content),
            },
        });
    }
}

export const versionService = new VersionService();
