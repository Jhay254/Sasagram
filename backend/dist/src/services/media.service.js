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
exports.MediaService = void 0;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const sharp_1 = __importDefault(require("sharp"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class MediaService {
    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads', 'media');
        this.optimizedDir = path.join(process.cwd(), 'uploads', 'optimized');
        this.ensureDirectories();
    }
    async ensureDirectories() {
        await fs.mkdir(this.uploadDir, { recursive: true });
        await fs.mkdir(this.optimizedDir, { recursive: true });
    }
    /**
     * Download media from URL and store with metadata
     */
    async downloadAndStore(url, userId, provider, contentId) {
        try {
            // Download file
            const response = await axios_1.default.get(url, {
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
        }
        catch (error) {
            console.error('Error downloading media:', error);
            return null;
        }
    }
    /**
     * Extract metadata from image/video
     */
    async extractMetadata(buffer, mimeType) {
        const metadata = {
            size: buffer.length,
        };
        // Only process images with sharp
        if (mimeType.startsWith('image/')) {
            try {
                const image = (0, sharp_1.default)(buffer);
                const imageMetadata = await image.metadata();
                metadata.width = imageMetadata.width;
                metadata.height = imageMetadata.height;
                metadata.format = imageMetadata.format;
                // Extract EXIF data
                if (imageMetadata.exif) {
                    metadata.exif = this.parseExif(imageMetadata.exif);
                }
            }
            catch (error) {
                console.error('Error extracting image metadata:', error);
            }
        }
        return metadata;
    }
    /**
     * Parse EXIF data
     */
    parseExif(exifBuffer) {
        try {
            // Basic EXIF parsing (can be enhanced with exif-parser library)
            return {
                // Placeholder - would need proper EXIF parsing library
                takenAt: new Date(),
            };
        }
        catch (error) {
            return {};
        }
    }
    /**
     * Optimize media (compress images, convert formats)
     */
    async optimizeMedia(mediaId) {
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
            await (0, sharp_1.default)(buffer)
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
        }
        catch (error) {
            console.error('Error optimizing media:', error);
            return false;
        }
    }
    /**
     * Calculate SHA-256 hash of file
     */
    calculateHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
    /**
     * Get file extension from MIME type
     */
    getExtensionFromMimeType(mimeType) {
        const mimeMap = {
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
    async processUserMedia(userId) {
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
            if (success)
                processed++;
        }
        return processed;
    }
    /**
     * Get media statistics for a user
     */
    async getUserMediaStats(userId) {
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
}
exports.MediaService = MediaService;
