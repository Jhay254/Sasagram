import { Request, Response } from 'express';
import { LegalService } from '../services/legal.service';

/**
 * Get current Terms of Service
 * GET /api/legal/tos
 */
export const getTermsOfService = async (req: Request, res: Response) => {
    try {
        const tos = await LegalService.getCurrentDocument('TOS');

        if (!tos) {
            return res.status(404).json({ error: 'Terms of Service not found' });
        }

        res.json(tos);
    } catch (error: any) {
        console.error('Error getting ToS:', error);
        res.status(500).json({ error: error.message || 'Failed to get Terms of Service' });
    }
};

/**
 * Get Privacy Policy
 * GET /api/legal/privacy
 */
export const getPrivacyPolicy = async (req: Request, res: Response) => {
    try {
        const privacy = await LegalService.getCurrentDocument('PRIVACY_POLICY');

        if (!privacy) {
            return res.status(404).json({ error: 'Privacy Policy not found' });
        }

        res.json(privacy);
    } catch (error: any) {
        console.error('Error getting Privacy Policy:', error);
        res.status(500).json({ error: error.message || 'Failed to get Privacy Policy' });
    }
};

/**
 * Get DMCA Policy
 * GET /api/legal/dmca
 */
export const getDMCAPolicy = async (req: Request, res: Response) => {
    try {
        const dmca = await LegalService.getCurrentDocument('DMCA_POLICY');

        if (!dmca) {
            return res.status(404).json({ error: 'DMCA Policy not found' });
        }

        res.json(dmca);
    } catch (error: any) {
        console.error('Error getting DMCA Policy:', error);
        res.status(500).json({ error: error.message || 'Failed to get DMCA Policy' });
    }
};

/**
 * Get all active legal documents
 * GET /api/legal/all
 */
export const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const documents = await LegalService.getAllActiveDocuments();

        res.json({ count: documents.length, documents });
    } catch (error: any) {
        console.error('Error getting legal documents:', error);
        res.status(500).json({ error: error.message || 'Failed to get legal documents' });
    }
};

/**
 * Get document history
 * GET /api/legal/:type/history
 */
export const getDocumentHistory = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;

        const history = await LegalService.getDocumentHistory(type.toUpperCase());

        res.json({ count: history.length, history });
    } catch (error: any) {
        console.error('Error getting document history:', error);
        res.status(500).json({ error: error.message || 'Failed to get document history' });
    }
};
