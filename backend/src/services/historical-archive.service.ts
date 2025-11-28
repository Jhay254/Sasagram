import prisma from '../db/prisma';
import { FeatureFlagService } from './feature-flag.service';
// import Tesseract from 'tesseract.js'; // For OCR
// import vision from '@google-cloud/vision'; // Google Vision AI

/**
 * Historical Archive Service - Bulk Import & OCR
 * Feature: FEATURE_HISTORICAL_ARCHIVE (disabled by default)
 */
export class HistoricalArchiveService {
    /**
     * Create historical archive
     */
    static async createArchive(userId: string, data: {
        name: string;
        description?: string;
        timePeriod?: string;
        category: string;
        isPublic?: boolean;
    }) {
        const isEnabled = await FeatureFlagService.isEnabled('FEATURE_HISTORICAL_ARCHIVE', userId);
        if (!isEnabled) {
            throw new Error('Historical Archive feature not available');
        }

        return await prisma.historicalArchive.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                timePeriod: data.timePeriod,
                category: data.category,
                isPublic: data.isPublic || false,
            },
        });
    }

    /**
     * Start bulk import batch
     */
    static async startImportBatch(userId: string, config: {
        archiveId?: string;
        source: string;
        totalFiles: number;
        autoOCR?: boolean;
        aiOrganize?: boolean;
    }) {
        const batch = await prisma.archiveImportBatch.create({
            data: {
                userId,
                archiveId: config.archiveId,
                source: config.source,
                totalFiles: config.totalFiles,
                autoOCR: config.autoOCR !== false,
                aiOrganize: config.aiOrganize !== false,
                status: 'PROCESSING',
                startedAt: new Date(),
            },
        });

        return batch;
    }

    /**
     * Process single archive item (photo/document)
     */
    static async processArchiveItem(
        archiveId: string,
        batchId: string,
        file: {
            url: string;
            filename: string;
            type: string; // PHOTO, DOCUMENT, LETTER
        }
    ) {
        // Determine if OCR is needed
        const needsOCR = ['DOCUMENT', 'LETTER'].includes(file.type);

        let ocrResult = null;
        if (needsOCR) {
            ocrResult = await this.performOCR(file.url);
        }

        // AI-powered metadata extraction
        const aiMetadata = await this.extractAIMetadata(file.url, ocrResult?.text);

        // Create archive item
        const item = await prisma.archiveItem.create({
            data: {
                archiveId,
                itemType: file.type,
                mediaUrl: file.url,
                originalFilename: file.filename,
                importBatchId: batchId,

                // OCR results
                ocrText: ocrResult?.text,
                ocrConfidence: ocrResult?.confidence,
                ocrLanguage: ocrResult?.language,

                // AI metadata
                detectedDate: aiMetadata.date,
                detectedLocation: aiMetadata.location,
                detectedPeople: aiMetadata.people,
                detectedEvents: aiMetadata.events,
                tags: aiMetadata.tags,
            },
        });

        // Update batch progress
        await prisma.archiveImportBatch.update({
            where: { id: batchId },
            data: {
                processedFiles: { increment: 1 },
            },
        });

        // Update archive item count
        await prisma.historicalArchive.update({
            where: { id: archiveId },
            data: {
                totalItems: { increment: 1 },
            },
        });

        return item;
    }

    /**
     * Get user's archives
     */
    static async getUserArchives(userId: string) {
        return await prisma.historicalArchive.findMany({
            where: { userId },
            include: {
                items: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get archive items with filters
     */
    static async getArchiveItems(archiveId: string, filters?: {
        itemType?: string;
        dateFrom?: Date;
        dateTo?: Date;
        search?: string;
    }) {
        return await prisma.archiveItem.findMany({
            where: {
                archiveId,
                ...(filters?.itemType && { itemType: filters.itemType }),
                ...(filters?.dateFrom && {
                    detectedDate: { gte: filters.dateFrom },
                }),
                ...(filters?.dateTo && {
                    detectedDate: { lte: filters.dateTo },
                }),
                ...(filters?.search && {
                    OR: [
                        { title: { contains: filters.search, mode: 'insensitive' } },
                        { description: { contains: filters.search, mode: 'insensitive' } },
                        { ocrText: { contains: filters.search, mode: 'insensitive' } },
                    ],
                }),
            },
            orderBy: { detectedDate: 'asc' },
        });
    }

    /**
     * Request public archive access
     */
    static async requestArchiveAccess(archiveId: string, request: {
        requesterEmail: string;
        requesterName: string;
        institution?: string;
        purpose: string;
        description: string;
    }) {
        // Check if archive is public
        const archive = await prisma.historicalArchive.findUnique({
            where: { id: archiveId },
        });

        if (!archive || !archive.isPublic) {
            throw new Error('Archive not publicly accessible');
        }

        return await prisma.publicArchiveAccess.create({
            data: {
                archiveId,
                requesterEmail: request.requesterEmail,
                requesterName: request.requesterName,
                institution: request.institution,
                purpose: request.purpose,
                description: request.description,
            },
        });
    }

    /**
     * Approve archive access
     */
    static async approveArchiveAccess(
        accessId: string,
        approvedBy: string,
        config: {
            accessLevel: string;
            expiresInDays?: number;
            requiresNDA?: boolean;
        }
    ) {
        const expiresAt = new Date();
        if (config.expiresInDays) {
            expiresAt.setDate(expiresAt.getDate() + config.expiresInDays);
        } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Default 1 year
        }

        return await prisma.publicArchiveAccess.update({
            where: { id: accessId },
            data: {
                accessGranted: true,
                accessLevel: config.accessLevel,
                approvedBy,
                approvedAt: new Date(),
                expiresAt,
                status: 'APPROVED',
            },
        });
    }

    /**
     * Search public archives
     */
    static async searchPublicArchives(query: {
        category?: string;
        timePeriod?: string;
        search?: string;
    }) {
        return await prisma.historicalArchive.findMany({
            where: {
                isPublic: true,
                ...(query.category && { category: query.category }),
                ...(query.timePeriod && {
                    timePeriod: { contains: query.timePeriod, mode: 'insensitive' },
                }),
                ...(query.search && {
                    OR: [
                        { name: { contains: query.search, mode: 'insensitive' } },
                        { description: { contains: query.search, mode: 'insensitive' } },
                    ],
                }),
            },
            include: {
                items: {
                    take: 3,
                    orderBy: { createdAt: 'desc' },
                },
                user: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { viewCount: 'desc' },
            take: 50,
        });
    }

    // ========== Private Helper Methods ==========

    /**
     * Perform OCR on document/letter
     */
    private static async performOCR(imageUrl: string): Promise<{
        text: string;
        confidence: number;
        language?: string;
    }> {
        try {
            // Production: Use Tesseract.js or Google Vision API
            // const { data } = await Tesseract.recognize(imageUrl, 'eng');
            // return {
            //   text: data.text,
            //   confidence: data.confidence / 100,
            //   language: 'eng',
            // };

            // MVP: Return placeholder
            return {
                text: '[OCR text will appear here]',
                confidence: 0.95,
                language: 'en',
            };
        } catch (error) {
            console.error('OCR error:', error);
            return {
                text: '',
                confidence: 0,
            };
        }
    }

    /**
     * Extract AI metadata from image/document
     */
    private static async extractAIMetadata(
        imageUrl: string,
        ocrText?: string
    ): Promise<{
        date?: Date;
        location?: string;
        people: string[];
        events: string[];
        tags: string[];
    }> {
        // Production: Use Google Vision AI for:
        // - Face detection & recognition
        // - Object detection
        // - Text detection (dates, locations)
        // - Landmark detection

        // MVP: Simple placeholder
        return {
            people: [],
            events: [],
            tags: ['vintage', 'historical'],
        };
    }
}
