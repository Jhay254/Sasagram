import prisma from '../db/prisma';

/**
 * Legal Document Service - Manage ToS, Privacy Policy, DMCA notices
 */
export class LegalService {
    /**
     * Get current legal document
     */
    static async getCurrentDocument(documentType: string) {
        return await prisma.legalDocument.findFirst({
            where: {
                documentType,
                isActive: true,
            },
            orderBy: { effectiveDate: 'desc' },
        });
    }

    /**
     * Create new legal document version
     */
    static async createDocument(data: {
        documentType: string;
        version: string;
        content: string;
        effectiveDate: Date;
        createdBy?: string;
    }) {
        // Deactivate previous versions
        await prisma.legalDocument.updateMany({
            where: {
                documentType: data.documentType,
                isActive: true,
            },
            data: { isActive: false },
        });

        // Create new version
        return await prisma.legalDocument.create({
            data: {
                ...data,
                isActive: true,
            },
        });
    }

    /**
     * Get document version history
     */
    static async getDocumentHistory(documentType: string) {
        return await prisma.legalDocument.findMany({
            where: { documentType },
            orderBy: { effectiveDate: 'desc' },
        });
    }

    /**
     * Get all active legal documents
     */
    static async getAllActiveDocuments() {
        const types = ['TOS', 'PRIVACY_POLICY', 'DMCA_POLICY', 'COPYRIGHT_AGENT'];

        const documents = await Promise.all(
            types.map((type) => this.getCurrentDocument(type))
        );

        return documents.filter((doc) => doc !== null);
    }
}
