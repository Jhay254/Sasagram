import crypto from 'crypto';

/**
 * Service for generating and validating forensic watermarks
 * Embeds unique identifiers into content for leak detection
 */
export class WatermarkService {
    /**
     * Generate unique watermark code
     */
    static generateWatermarkCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const segments = [];

        for (let i = 0; i < 4; i++) {
            let segment = '';
            for (let j = 0; j < 4; j++) {
                segment += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            segments.push(segment);
        }

        return `WM-${segments.join('-')}`;
    }

    /**
     * Embed invisible watermark in text (PDF/HTML)
     */
    static embedTextWatermark(content: string, watermarkData: any): string {
        const watermarkCode = watermarkData.code;

        // Method 1: Zero-width characters (invisible)
        const zeroWidthChars = {
            '0': '\u200B', // Zero-width space
            '1': '\u200C', // Zero-width non-joiner
            '2': '\u200D', // Zero-width joiner
            '3': '\uFEFF', // Zero-width no-break space
        };

        // Convert watermark to binary
        const binary = Buffer.from(JSON.stringify(watermarkData)).toString('base64');

        // Insert zero-width characters throughout content
        let watermarkedContent = content;
        const insertPositions = this.generateInsertPositions(content.length, binary.length);

        let offset = 0;
        insertPositions.forEach((pos, index) => {
            const char = binary[index % binary.length];
            const zeroWidthChar = zeroWidthChars[char.charCodeAt(0) % 4 as keyof typeof zeroWidthChars];
            watermarkedContent =
                watermarkedContent.slice(0, pos + offset) +
                zeroWidthChar +
                watermarkedContent.slice(pos + offset);
            offset++;
        });

        // Method 2: HTML comment watermark (visible in source)
        watermarkedContent += `\n<!-- FORENSIC_WM: ${watermarkCode} -->`;

        return watermarkedContent;
    }

    /**
     * Embed watermark in PDF metadata
     */
    static generatePDFWatermarkMetadata(watermarkData: any) {
        return {
            Title: watermarkData.reportTitle || 'Shadow Self Report',
            Author: 'Lifeline, Inc.',
            Subject: `Report for User ${watermarkData.userId}`,
            Keywords: watermarkData.code,
            Creator: 'Lifeline Shadow Self Generator',
            Producer: 'Lifeline PDF Engine',
            CustomMetadata: {
                WatermarkCode: watermarkData.code,
                GeneratedAt: watermarkData.timestamp,
                SessionId: watermarkData.sessionId,
                DeviceId: watermarkData.deviceId,
                // Encrypted user data
                EncryptedUserData: this.encryptWatermarkData(watermarkData),
            },
        };
    }

    /**
     * Create visible watermark overlay (subtle)
     */
    static createVisibleWatermark(watermarkCode: string): string {
        const shortCode = watermarkCode.substring(3, 11); // Remove "WM-" and shorten

        return `
      <div style="
        position: fixed;
        bottom: 10px;
        right: 10px;
        font-size: 9px;
        color: rgba(0,0,0,0.15);
        font-family: monospace;
        user-select: none;
        pointer-events: none;
        z-index: 9999;
      ">
        ${shortCode}
      </div>
    `;
    }

    /**
     * Generate steganographic watermark for images
     */
    static async embedImageWatermark(imageBuffer: Buffer, watermarkData: any): Promise<Buffer> {
        // LSB (Least Significant Bit) steganography
        // This is a placeholder - real implementation would use image processing library

        const metadata = JSON.stringify({
            code: watermarkData.code,
            userId: watermarkData.userId,
            timestamp: watermarkData.timestamp,
        });

        // In production, use a library like 'sharp' or 'jimp' to embed in LSB
        // For now, just append metadata to EXIF

        return imageBuffer; // Placeholder
    }

    /**
     * Extract watermark from content
     */
    static extractWatermark(content: string): string | null {
        // Try to find HTML comment watermark
        const commentMatch = content.match(/<!-- FORENSIC_WM: (WM-[A-Z0-9-]+) -->/);
        if (commentMatch) {
            return commentMatch[1];
        }

        // Try to extract from zero-width characters (more complex)
        // This would require reversing the embedding process

        return null;
    }

    /**
     * Encrypt watermark data for secure storage
     */
    private static encryptWatermarkData(data: any): string {
        const secret = process.env.WATERMARK_SECRET || 'lifeline-watermark-secret-key';
        const cipher = crypto.createCipher('aes-256-cbc', secret);

        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return encrypted;
    }

    /**
     * Generate random insert positions for watermark
     */
    private static generateInsertPositions(contentLength: number, count: number): number[] {
        const positions = [];
        const step = Math.floor(contentLength / count);

        for (let i = 0; i < count; i++) {
            positions.push(i * step + Math.floor(Math.random() * step));
        }

        return positions;
    }

    /**
     * Validate watermark integrity
     */
    static validateWatermark(code: string): boolean {
        return /^WM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
    }
}
