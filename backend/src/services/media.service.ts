import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MediaMetadata {
    width?: number;
    height?: number;
    format?: string;
    size: number;
    exif?: {
        latitude?: number;
        longitude?: number;
        takenAt?: Date;
        cameraModel?: string;
    };
}

export class MediaService {
    private uploadDir: string;
    private optimizedDir: string;

    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads', 'media');
        this.optimizedDir = path.join(process.cwd(), 'uploads', 'optimized');
        this.ensureDirectories();
    }

    private async ensureDirectories() {
        await fs.mkdir(this.uploadDir, { recursive: true });
        await fs.mkdir(this.optimizedDir, { recursive: true });
    }

    /**
     * Download media from URL and store with metadata
     */
    async downloadAndStore(
        url: string,
        userId: string,
        provider: string,
        contentId?: string
    ): Promise<string | null> {
        try {
            // Validate URL to prevent SSRF
            if (!this.isValidUrl(url)) {
                console.error(`Blocked potential SSRF attempt: ${url}`);
                return null;
            }

            // Download file
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000,
            });

            const buffer = Buffer.from(response.data);

            // Calculate hash for deduplication
            const fileHash = this.calculateHash(buffer);

            // Check if already exists
            const existing = await prisma.media.findUnique({
                where: { fileHash },
            });

            if (existing) {
                console.log(`Media already exists: ${fileHash}`);
                return existing.id;
            }

            // Determine MIME type
            const mimeType = response.headers['content-type'] || 'application/octet-stream';
            const extension = this.getExtensionFromMimeType(mimeType);
            const filename = `${fileHash}${extension}`;
            const localPath = path.join(this.uploadDir, filename);

            // Save file
            await fs.writeFile(localPath, buffer);

            // Extract metadata
            const metadata = await this.extractMetadata(buffer, mimeType);

            // Store in database
            const media = await prisma.media.create({
                data: {
                    userId,
                    contentId,
                    provider,
                    originalUrl: url,
                    localPath,
                    fileHash,
                    fileSize: buffer.length,
                    mimeType,
                    width: metadata.width,
                    height: metadata.height,
                    latitude: metadata.exif?.latitude,
                    longitude: metadata.exif?.longitude,
                    takenAt: metadata.exif?.takenAt,
                    cameraModel: metadata.exif?.cameraModel,
                    isProcessed: true,
                },
            });

            console.log(`Downloaded media: ${media.id}`);
            return media.id;
        } catch (error) {
            console.error('Error downloading media:', error);
            return null;
        }
    }

    /**
     * Extract metadata from image/video
     */
    private async extractMetadata(buffer: Buffer, mimeType: string): Promise<MediaMetadata> {
        const metadata: MediaMetadata = {
            size: buffer.length,
        };

        // Only process images with sharp
        if (mimeType.startsWith('image/')) {
            try {
                const image = sharp(buffer);
                const imageMetadata = await image.metadata();

                metadata.width = imageMetadata.width;
                metadata.height = imageMetadata.height;
                metadata.format = imageMetadata.format;

                // Extract EXIF data
                if (imageMetadata.exif) {
                    metadata.exif = this.parseExif(imageMetadata.exif);
                }
            } catch (error) {
                console.error('Error extracting image metadata:', error);
            }
        }

        return metadata;
    }

    /**
     * Parse EXIF data
     */
    private parseExif(exifBuffer: Buffer): MediaMetadata['exif'] {
        try {
            // Basic EXIF parsing (can be enhanced with exif-parser library)
            return {
                // Placeholder - would need proper EXIF parsing library
                takenAt: new Date(),
            };
        } catch (error) {
            return {};
        }
    }

    /**
     * Optimize media (compress images, convert formats)
     */
    async optimizeMedia(mediaId: string): Promise<boolean> {
        try {
            const media = await prisma.media.findUnique({
                where: { id: mediaId },
            });

            if (!media || !media.localPath || media.isOptimized) {
                return false;
            }

            // Only optimize images
            if (!media.mimeType.startsWith('image/')) {
                return false;
            }

            const buffer = await fs.readFile(media.localPath);
            const optimizedFilename = `opt_${path.basename(media.localPath)}`;
            const optimizedPath = path.join(this.optimizedDir, optimizedFilename);

            // Optimize with sharp
            await sharp(buffer)
                .resize(1920, 1920, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 85, progressive: true })
                .toFile(optimizedPath);

            // Update database
            await prisma.media.update({
                where: { id: mediaId },
                data: {
                    isOptimized: true,
                    optimizedPath,
                },
            });

            console.log(`Optimized media: ${mediaId}`);
            return true;
        } catch (error) {
            console.error('Error optimizing media:', error);
            return false;
        }
    }

    /**
     * Calculate SHA-256 hash of file
     */
    private calculateHash(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Get file extension from MIME type
     */
    private getExtensionFromMimeType(mimeType: string): string {
        const mimeMap: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'video/mp4': '.mp4',
            'video/quicktime': '.mov',
        };
        return mimeMap[mimeType] || '.bin';
    }

    /**
     * Batch process media for a user
     */
    async processUserMedia(userId: string): Promise<number> {
        const unprocessedMedia = await prisma.media.findMany({
            where: {
                userId,
                isOptimized: false,
                mimeType: {
                    startsWith: 'image/',
                },
            },
            take: 50,
        });

        let processed = 0;
        for (const media of unprocessedMedia) {
            const success = await this.optimizeMedia(media.id);
            if (success) processed++;
        }

        return processed;
    }

    /**
     * Get media statistics for a user
     */
    async getUserMediaStats(userId: string) {
        const stats = await prisma.media.groupBy({
            by: ['provider', 'mimeType'],
            where: { userId },
            _count: true,
            _sum: {
                fileSize: true,
            },
        });

        return stats;
    }

    /**
     * Validate URL to prevent SSRF
     * Blocks private IP ranges, localhost, and metadata services
     */
    private isValidUrl(urlString: string): boolean {
        try {
            const url = new URL(urlString);

            // Allow only http and https
            if (!['http:', 'https:'].includes(url.protocol)) {
                return false;
            }

            const hostname = url.hostname;

            // Block localhost
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
                return false;
            }

            // Block AWS metadata service
            if (hostname === '169.254.169.254') {
                return false;
            }

            // Block private IP ranges (basic check)
            // 10.0.0.0/8
            if (hostname.startsWith('10.')) return false;
            // 172.16.0.0/12
            if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return false;
            // 192.168.0.0/16
            if (hostname.startsWith('192.168.')) return false;

            return true;
        } catch (error) {
            return false;
        }
    }
}
