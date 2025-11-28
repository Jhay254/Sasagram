import { Request, Response } from 'express';
import { DMCAService } from '../services/dmca.service';

/**
 * Submit DMCA takedown request
 * POST /api/dmca/takedown
 */
export const submitTakedownRequest = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const {
            requesterEmail,
            requesterName,
            infringingUrl,
            originalWork,
            copyrightOwner,
            registrationNumber,
            evidenceUrls,
            description,
            signatureData,
        } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const takedown = await DMCAService.submitTakedownRequest({
            requesterId: userId,
            requesterEmail,
            requesterName,
            infringingUrl,
            originalWork,
            copyrightOwner,
            registrationNumber,
            evidenceUrls,
            description,
            signatureData,
        });

        res.status(201).json({
            success: true,
            message: 'DMCA takedown request submitted. Content will be processed automatically.',
            takedown,
        });
    } catch (error: any) {
        console.error('Error submitting DMCA takedown:', error);
        res.status(500).json({ error: error.message || 'Failed to submit takedown request' });
    }
};

/**
 * Submit counter-notice
 * POST /api/dmca/:id/counter-notice
 */
export const submitCounterNotice = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id: takedownId } = req.params;
        const { name, email, address, statement } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const counterNotice = await DMCAService.submitCounterNotice(takedownId, {
            userId,
            name,
            email,
            address,
            statement,
        });

        res.status(201).json({
            success: true,
            message: 'Counter-notice submitted. Content will be restored in 10-14 business days if no objection.',
            counterNotice,
        });
    } catch (error: any) {
        console.error('Error submitting counter-notice:', error);
        res.status(500).json({ error: error.message || 'Failed to submit counter-notice' });
    }
};

/**
 * Get user's takedown requests
 * GET /api/dmca/requests?filter=sent|received
 */
export const getUserTakedownRequests = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const filter = req.query.filter as 'sent' | 'received' | undefined;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const requests = await DMCAService.getUserTakedownRequests(userId, filter);

        res.json({ count: requests.length, requests });
    } catch (error: any) {
        console.error('Error getting takedown requests:', error);
        res.status(500).json({ error: error.message || 'Failed to get takedown requests' });
    }
};

/**
 * Get takedown status
 * GET /api/dmca/:id/status
 */
export const getTakedownStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const status = await DMCAService.getTakedownStatus(id);

        if (!status) {
            return res.status(404).json({ error: 'Takedown request not found' });
        }

        res.json(status);
    } catch (error: any) {
        console.error('Error getting takedown status:', error);
        res.status(500).json({ error: error.message || 'Failed to get takedown status' });
    }
};
