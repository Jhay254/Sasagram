import { ethers } from 'ethers';
import crypto from 'crypto';
import QRCode from 'qrcode';
import prisma from '../db/prisma';

// Import contract ABI (would be generated after deploying contract)
const CONTRACT_ABI = [
    'function verifyContent(bytes32 _contentHash, string memory _contentType) public returns (bool)',
    'function getContentRecord(bytes32 _contentHash) public view returns (address, uint256, string, bool)',
    'function isVerified(bytes32 _contentHash) public view returns (bool)',
    'function getTotalVerifications() public view returns (uint256)',
];

/**
 * Blockchain Service - Polygon (MATIC) integration for content verification
 * User-paid gas model
 */
export class BlockchainService {
    private provider: ethers.providers.JsonRpcProvider;
    private contract: ethers.Contract;
    private contractAddress: string;

    constructor() {
        // Polygon Mainnet RPC
        this.provider = new ethers.providers.JsonRpcProvider(
            process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
        );

        this.contractAddress = process.env.CONTRACT_ADDRESS || '';

        // Contract instance (read-only, users sign their own transactions)
        this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.provider);
    }

    /**
     * Generate content hash (SHA-256)
     */
    static generateContentHash(content: Buffer): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Prepare transaction for user to sign (user pays gas)
     */
    async prepareVerificationTransaction(
        userId: string,
        contentId: string,
        contentType: string,
        content: Buffer
    ) {
        // Generate content hash
        const contentHash = BlockchainService.generateContentHash(content);
        const contentHashBytes = ethers.utils.keccak256('0x' + contentHash);

        // Check if already verified
        const alreadyVerified = await this.contract.isVerified(contentHashBytes);
        if (alreadyVerified) {
            throw new Error('Content already verified on blockchain');
        }

        // Prepare transaction data
        const txData = this.contract.interface.encodeFunctionData('verifyContent', [
            contentHashBytes,
            contentType,
        ]);

        // Estimate gas
        const gasEstimate = await this.contract.estimateGas.verifyContent(contentHashBytes, contentType);

        // Get current gas price
        const gasPrice = await this.provider.getGasPrice();

        // Calculate cost in MATIC
        const gasCostWei = gasEstimate.mul(gasPrice);
        const gasCostMatic = parseFloat(ethers.utils.formatEther(gasCostWei));

        // Create pending verification record
        const verification = await prisma.blockchainVerification.create({
            data: {
                userId,
                contentId,
                contentType,
                contentHash,
                status: 'PENDING',
                networkId: 'polygon',
                contractAddress: this.contractAddress,
                gasCost: gasCostMatic,
            },
        });

        return {
            verificationId: verification.id,
            contentHash,
            transaction: {
                to: this.contractAddress,
                data: txData,
                gasLimit: gasEstimate.toString(),
                gasPrice: gasPrice.toString(),
            },
            estimatedCost: {
                matic: gasCostMatic,
                usd: gasCostMatic * 0.5, // Approximate MATIC price
            },
        };
    }

    /**
     * Confirm verification after user signs transaction
     */
    async confirmVerification(verificationId: string, transactionHash: string) {
        // Wait for transaction confirmation
        const receipt = await this.provider.waitForTransaction(transactionHash, 2); // 2 confirmations

        if (receipt.status !== 1) {
            await prisma.blockchainVerification.update({
                where: { id: verificationId },
                data: { status: 'FAILED' },
            });
            throw new Error('Transaction failed');
        }

        // Generate QR code for public verification
        const verification = await prisma.blockchainVerification.findUnique({
            where: { id: verificationId },
        });

        const publicUrl = `https://lifeline.app/verify/${verification?.contentHash}`;
        const qrCodeData = await QRCode.toDataURL(publicUrl);

        // Update verification record
        const updated = await prisma.blockchainVerification.update({
            where: { id: verificationId },
            data: {
                status: 'VERIFIED',
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                verifiedAt: new Date(),
                blockchainUrl: `https://polygonscan.com/tx/${receipt.transactionHash}`,
                publicVerificationUrl: publicUrl,
                qrCodeData,
            },
        });

        return updated;
    }

    /**
     * Verify content publicly (no auth required)
     */
    async verifyPublicly(contentHash: string): Promise<{
        verified: boolean;
        creator?: string;
        timestamp?: Date;
        contentType?: string;
        blockchainUrl?: string;
    }> {
        const contentHashBytes = ethers.utils.keccak256('0x' + contentHash);

        // Query smart contract
        const [creator, timestamp, contentType, exists] = await this.contract.getContentRecord(
            contentHashBytes
        );

        if (!exists) {
            return { verified: false };
        }

        // Get local verification record for additional data
        const localRecord = await prisma.blockchainVerification.findUnique({
            where: { contentHash },
        });

        return {
            verified: true,
            creator: creator,
            timestamp: new Date(timestamp.toNumber() * 1000),
            contentType,
            blockchainUrl: localRecord?.blockchainUrl,
        };
    }

    /**
     * Get user's blockchain verifications
     */
    async getUserVerifications(userId: string) {
        return await prisma.blockchainVerification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get verification statistics
     */
    async getVerificationStats(userId: string) {
        const verifications = await prisma.blockchainVerification.findMany({
            where: { userId, status: 'VERIFIED' },
        });

        const totalGasCost = verifications.reduce((sum, v) => sum + (v.gasCost || 0), 0);

        return {
            total: verifications.length,
            totalGasCost,
            byType: verifications.reduce((acc, v) => {
                acc[v.contentType] = (acc[v.contentType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };
    }
}
