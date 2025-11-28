import { Request, Response } from 'express';
import { EnhancedWatermarkService } from '../services/enhanced-watermark.service';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Apply watermark to image
 * POST /api/watermark/apply
 */
export const applyWatermark = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { contentId, forensicConsent, watermarkText } = req.body;
        const imageFile = (req as any).file;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!imageFile) {
            return res.status(400).json({ error: 'Image file required' });
        }

        const result = await EnhancedWatermarkService.applyWatermarkToImage(
            userId,
            contentId,
            imageFile.buffer,
            {
                forensicConsent: forensicConsent === 'true' || forensicConsent === true,
                watermarkText,
            }
        );

        // Return watermarked image
        res.set('Content-Type', 'image/png');
        res.send(result.watermarkedImage);
    } catch (error: any) {
        console.error('Error applying watermark:', error);
        res.status(500).json({ error: error.message || 'Failed to apply watermark' });
    }
};

/**
 * Verify watermark authenticity
 * POST /api/watermark/verify
 */
export const verifyWatermark = async (req: Request, res: Response) => {
    try {
        const { watermarkHash } = req.body;

        if (!watermarkHash) {
            return res.status(400).json({ error: 'Watermark hash required' });
        }

        const result = await EnhancedWatermarkService.verifyWatermark(watermarkHash);

        res.json(result);
    } catch (error: any) {
        console.error('Error verifying watermark:', error);
        res.status(500).json({ error: error.message || 'Failed to verify watermark' });
    }
};

/**
 * Report leaked content
 * POST /api/watermark/report-leak
 */
export const reportLeak = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { watermarkHash } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!watermarkHash) {
            return res.status(400).json({ error: 'Watermark hash required' });
        }

        const result = await EnhancedWatermarkService.reportLeak(watermarkHash, userId);

        res.json({
            success: true,
            message: 'Leak reported. Content owner has been notified.',
            ...result,
        });
    } catch (error: any) {
        console.error('Error reporting leak:', error);
        res.status(500).json({ error: error.message || 'Failed to report leak' });
    }
};

/**
 * Extract forensic watermark
 * POST /api/watermark/extract
 */
export const extractForensicWatermark = async (req: Request, res: Response) => {
    try {
        const imageFile = (req as any).file;

        if (!imageFile) {
            return res.status(400).json({ error: 'Image file required' });
        }

        const forensicData = await EnhancedWatermarkService.extractForensicWatermark(imageFile.buffer);

        if (!forensicData) {
            return res.json({ found: false, message: 'No forensic watermark detected' });
        }

        res.json({
            found: true,
            forensicData: JSON.parse(forensicData),
        });
    } catch (error: any) {
        console.error('Error extracting watermark:', error);
        res.status(500).json({ error: error.message || 'Failed to extract watermark' });
    }
};

export { upload };
