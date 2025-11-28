import sharp from 'sharp';
import crypto from 'crypto';
import prisma from '../db/prisma';

/**
 * Enhanced Watermark Service - Server-side watermarking with forensic tracking
 * Features: Semi-transparent overlays, invisible steganography (opt-in)
 */
export class EnhancedWatermarkService {
    /**
     * Apply semi-transparent watermark to image
     */
    static async applyWatermarkToImage(
        userId: string,
        contentId: string,
        imageBuffer: Buffer,
        options: {
            forensicConsent?: boolean;
            watermarkText?: string;
        } = {}
    ) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        // Generate visible watermark text
        const visibleText = options.watermarkText || `© ${user.name} • Lifeline • ${new Date().getFullYear()}`;

        // Create semi-transparent watermark overlay
        const watermarkedImage = await this.createSemiTransparentWatermark(imageBuffer, visibleText);

        // Embed forensic watermark if user consented (opt-in)
        let finalImage = watermarkedImage;
        let forensicData = '';

        if (options.forensicConsent) {
            const forensic = {
                userId,
                contentId,
                timestamp: Date.now(),
                trackingId: crypto.randomUUID(),
            };
            forensicData = JSON.stringify(forensic);
            finalImage = await this.embedForensicWatermark(watermarkedImage, forensicData);
        }

        // Generate hash for verification
        const watermarkHash = crypto.createHash('sha256').update(finalImage).digest('hex');

        // Create tracking record
        const watermark = await prisma.contentWatermark.create({
            data: {
                userId,
                contentId,
                contentType: 'IMAGE',
                visibleWatermark: visibleText,
                forensicWatermark: forensicData,
                forensicConsent: options.forensicConsent || false,
                watermarkHash,
            },
        });

        return {
            watermarkedImage: finalImage,
            watermark,
        };
    }

    /**
     * Create semi-transparent text overlay
     */
    private static async createSemiTransparentWatermark(
        imageBuffer: Buffer,
        text: string
    ): Promise<Buffer> {
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();

        const width = metadata.width || 800;
        const height = metadata.height || 600;

        // Calculate font size based on image dimensions
        const fontSize = Math.floor(width / 20);

        // Create SVG watermark overlay (semi-transparent, diagonal)
        const svgWatermark = `
      <svg width="${width}" height="${height}">
        <defs>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap');
          </style>
        </defs>
        <text
          x="50%"
          y="50%"
          font-family="Inter, Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="600"
          fill="white"
          fill-opacity="0.3"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(-45 ${width / 2} ${height / 2})"
        >
          ${text}
        </text>
      </svg>
    `;

        const watermarkedImage = await image
            .composite([
                {
                    input: Buffer.from(svgWatermark),
                    top: 0,
                    left: 0,
                },
            ])
            .toBuffer();

        return watermarkedImage;
    }

    /**
     * Embed forensic watermark using steganography (LSB method)
     */
    private static async embedForensicWatermark(
        imageBuffer: Buffer,
        data: string
    ): Promise<Buffer> {
        // Simple LSB steganography implementation
        // In production, use a robust library like stegcloak or steganography.js

        const image = sharp(imageBuffer);
        const { data: pixels, info } = await image.raw().toBuffer({ resolveWithObject: true });

        const message = Buffer.from(data, 'utf8');
        const messageLength = message.length;

        // Embed message length in first 32 bits
        for (let i = 0; i < 32; i++) {
            const bit = (messageLength >> (31 - i)) & 1;
            pixels[i] = (pixels[i] & 0xfe) | bit;
        }

        // Embed message data
        for (let i = 0; i < messageLength * 8; i++) {
            const byteIndex = Math.floor(i / 8);
            const bitIndex = 7 - (i % 8);
            const bit = (message[byteIndex] >> bitIndex) & 1;
            pixels[32 + i] = (pixels[32 + i] & 0xfe) | bit;
        }

        const watermarked = await sharp(pixels, {
            raw: {
                width: info.width,
                height: info.height,
                channels: info.channels,
            },
        })
            .toFormat(info.format as any)
            .toBuffer();

        return watermarked;
    }

    /**
     * Extract forensic watermark from image
     */
    static async extractForensicWatermark(imageBuffer: Buffer): Promise<string | null> {
        try {
            const image = sharp(imageBuffer);
            const { data: pixels } = await image.raw().toBuffer({ resolveWithObject: true });

            // Extract message length from first 32 bits
            let messageLength = 0;
            for (let i = 0; i < 32; i++) {
                const bit = pixels[i] & 1;
                messageLength = (messageLength << 1) | bit;
            }

            // Extract message data
            const messageBytes: number[] = [];
            for (let i = 0; i < messageLength; i++) {
                let byte = 0;
                for (let j = 0; j < 8; j++) {
                    const bit = pixels[32 + i * 8 + j] & 1;
                    byte = (byte << 1) | bit;
                }
                messageBytes.push(byte);
            }

            const message = Buffer.from(messageBytes).toString('utf8');
            return message;
        } catch (error) {
            console.error('Error extracting forensic watermark:', error);
            return null;
        }
    }

    /**
     * Verify watermark authenticity
     */
    static async verifyWatermark(watermarkHash: string) {
        const watermark = await prisma.contentWatermark.findUnique({
            where: { watermarkHash },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        if (!watermark) {
            return { valid: false, message: 'Watermark not found' };
        }

        await prisma.contentWatermark.update({
            where: { id: watermark.id },
            data: { verifiedCount: { increment: 1 } },
        });

        return {
            valid: true,
            watermark,
            owner: watermark.user,
        };
    }

    /**
     * Report leaked content
     */
    static async reportLeak(watermarkHash: string, reportedBy: string) {
        const watermark = await prisma.contentWatermark.findUnique({
            where: { watermarkHash },
        });

        if (!watermark) {
            throw new Error('Watermark not found');
        }

        await prisma.contentWatermark.update({
            where: { id: watermark.id },
            data: {
                leakReported: true,
                leakReportedAt: new Date(),
            },
        });

        // Notify content owner
        // TODO: Send notification to watermark.userId

        return { success: true, owner: watermark.userId };
    }

    /**
     * Get content-type specific vault access limits
     */
    static getVaultAccessLimit(contentType: string): number {
        const limits: Record<string, number> = {
            TEXT: 300, // 5 minutes
            IMAGE: 600, // 10 minutes
            VIDEO: 900, // 15 minutes
            DOCUMENT: 1800, // 30 minutes
        };

        return limits[contentType] || 300;
    }
}
