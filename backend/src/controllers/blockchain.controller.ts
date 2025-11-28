import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain.service';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const blockchainService = new BlockchainService();

/**
 * Prepare blockchain verification transaction (user will sign)
 * POST /api/blockchain/prepare
 */
export const prepareVerification = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { contentId, contentType } = req.body;
        const contentFile = (req as any).file;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!contentFile) {
            return res.status(400).json({ error: 'Content file required' });
        }

        const result = await blockchainService.prepareVerificationTransaction(
            userId,
            contentId,
            contentType,
            contentFile.buffer
        );

        res.json(result);
    } catch (error: any) {
        console.error('Error preparing verification:', error);
        res.status(500).json({ error: error.message || 'Failed to prepare verification' });
    }
};

/**
 * Confirm blockchain verification after user signs transaction
 * POST /api/blockchain/confirm
 */
export const confirmVerification = async (req: Request, res: Response) => {
    try {
        const { verificationId, transactionHash } = req.body;

        if (!verificationId || !transactionHash) {
            return res.status(400).json({ error: 'Verification ID and transaction hash required' });
        }

        const verification = await blockchainService.confirmVerification(verificationId, transactionHash);

        res.json({
            success: true,
            verification,
            message: 'Content verified on blockchain',
        });
    } catch (error: any) {
        console.error('Error confirming verification:', error);
        res.status(500).json({ error: error.message || 'Failed to confirm verification' });
    }
};

/**
 * Get verification status
 * GET /api/blockchain/:id/status
 */
export const getVerificationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const verification = await prisma.blockchainVerification.findUnique({
            where: { id },
        });

        if (!verification) {
            return res.status(404).json({ error: 'Verification not found' });
        }

        res.json(verification);
    } catch (error: any) {
        console.error('Error getting verification status:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get blockchain proof for content hash
 * GET /api/blockchain/proof/:hash
 */
export const getBlockchainProof = async (req: Request, res: Response) => {
    try {
        const { hash } = req.params;

        const verification = await prisma.blockchainVerification.findUnique({
            where: { contentHash: hash },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!verification) {
            return res.status(404).json({ error: 'No blockchain proof found for this content' });
        }

        res.json({
            verified: verification.status === 'VERIFIED',
            contentHash: verification.contentHash,
            transactionHash: verification.transactionHash,
            blockNumber: verification.blockNumber,
            verifiedAt: verification.verifiedAt,
            blockchainUrl: verification.blockchainUrl,
            creator: verification.user,
            qrCode: verification.qrCodeData,
        });
    } catch (error: any) {
        console.error('Error getting blockchain proof:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get user's blockchain verifications
 * GET /api/blockchain/user
 */
export const getUserVerifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const verifications = await blockchainService.getUserVerifications(userId);
        const stats = await blockchainService.getVerificationStats(userId);

        res.json({
            verifications,
            stats,
        });
    } catch (error: any) {
        console.error('Error getting user verifications:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Public verification (no auth required)
 * GET /api/blockchain/verify-public/:hash
 */
export const verifyPublicly = async (req: Request, res: Response) => {
    try {
        const { hash } = req.params;

        const result = await blockchainService.verifyPublicly(hash);

        res.json(result);
    } catch (error: any) {
        console.error('Error verifying publicly:', error);
        res.status(500).json({ error: error.message });
    }
};

export { upload };
