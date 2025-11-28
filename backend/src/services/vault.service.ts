import crypto from 'crypto';
import prisma from '../db/prisma';
import { EnhancedWatermarkService } from './enhanced-watermark.service';

/**
 * Vault Service - Enhanced security for sensitive content
 * Features: AES-256 encryption, biometric + PIN, content-type-specific time limits
 */
export class VaultService {
    /**
     * Create vault content with encryption
     */
    static async createVaultContent(
        userId: string,
        data: {
            title: string;
            content: string;
            contentType: string;
            requiresBiometric?: boolean;
            requiresPIN?: boolean;
        }
    ) {
        // Generate encryption key
        const encryptionKey = crypto.randomBytes(32);

        // Encrypt content with AES-256-GCM
        const encrypted = this.encryptContent(data.content, encryptionKey);

        // Encrypt the key with user's master key (derived from password)
        const encryptedKey = await this.encryptKeyWithUserMasterKey(encryptionKey, userId);

        // Get content-type specific access limit
        const accessTimeLimit = EnhancedWatermarkService.getVaultAccessLimit(data.contentType);

        const vaultContent = await prisma.vaultContent.create({
            data: {
                userId,
                title: data.title,
                contentType: data.contentType,
                encryptedContent: encrypted,
                encryptionKey: encryptedKey,
                requiresBiometric: data.requiresBiometric ?? true,
                requiresPIN: data.requiresPIN ?? true,
                accessTimeLimit,
            },
        });

        return vaultContent;
    }

    /**
     * Access vault content with MFA
     */
    static async accessVaultContent(
        userId: string,
        vaultId: string,
        authData: {
            biometricVerified?: boolean;
            pinVerified?: boolean;
            deviceId: string;
            ipAddress: string;
            geoLocation?: string;
        }
    ) {
        const vault = await prisma.vaultContent.findUnique({
            where: { id: vaultId },
        });

        if (!vault) {
            throw new Error('Vault content not found');
        }

        if (vault.userId !== userId) {
            throw new Error('Unauthorized access');
        }

        // Verify authentication requirements
        if (vault.requiresBiometric && !authData.biometricVerified) {
            throw new Error('Biometric authentication required');
        }

        if (vault.requiresPIN && !authData.pinVerified) {
            throw new Error('PIN authentication required');
        }

        // Generate time-limited access token
        const accessToken = this.generateAccessToken(vaultId, vault.accessTimeLimit);

        // Log access
        await prisma.vaultAccessLog.create({
            data: {
                vaultContentId: vaultId,
                userId,
                deviceId: authData.deviceId,
                ipAddress: authData.ipAddress,
                geoLocation: authData.geoLocation,
                authMethod: this.getAuthMethod(authData),
                accessDuration: vault.accessTimeLimit,
            },
        });

        // Update view count
        await prisma.vaultContent.update({
            where: { id: vaultId },
            data: {
                viewCount: { increment: 1 },
                lastAccessedAt: new Date(),
            },
        });

        // Decrypt content
        const decryptionKey = await this.decryptKeyWithUserMasterKey(vault.encryptionKey, userId);
        const decryptedContent = this.decryptContent(vault.encryptedContent, decryptionKey);

        return {
            content: decryptedContent,
            accessToken,
            expiresIn: vault.accessTimeLimit,
            expiresAt: new Date(Date.now() + vault.accessTimeLimit * 1000),
        };
    }

    /**
     * Verify access token
     */
    static verifyAccessToken(token: string): { valid: boolean; vaultId?: string } {
        try {
            const decoded = JSON.parse(
                Buffer.from(token, 'base64').toString('utf8')
            );

            if (decoded.expiresAt < Date.now()) {
                return { valid: false };
            }

            return { valid: true, vaultId: decoded.vaultId };
        } catch (error) {
            return { valid: false };
        }
    }

    /**
     * Get user's vault content
     */
    static async getUserVaultContent(userId: string) {
        return await prisma.vaultContent.findMany({
            where: { userId },
            select: {
                id: true,
                title: true,
                contentType: true,
                requiresBiometric: true,
                requiresPIN: true,
                accessTimeLimit: true,
                viewCount: true,
                lastAccessedAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Delete vault content
     */
    static async deleteVaultContent(userId: string, vaultId: string) {
        const vault = await prisma.vaultContent.findUnique({
            where: { id: vaultId },
        });

        if (!vault || vault.userId !== userId) {
            throw new Error('Unauthorized');
        }

        await prisma.vaultContent.delete({
            where: { id: vaultId },
        });

        return { success: true };
    }

    // ========== Private Helper Methods ==========

    /**
     * Encrypt content with AES-256-GCM
     */
    private static encryptContent(content: string, key: Buffer): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(content, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return JSON.stringify({
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
        });
    }

    /**
     * Decrypt content with AES-256-GCM
     */
    private static decryptContent(encryptedData: string, key: Buffer): string {
        const { encrypted, iv, authTag } = JSON.parse(encryptedData);

        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            key,
            Buffer.from(iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Encrypt key with user's master key (derived from password)
     */
    private static async encryptKeyWithUserMasterKey(
        key: Buffer,
        userId: string
    ): Promise<string> {
        // In production, derive master key from user's password using PBKDF2
        // For now, use a placeholder implementation
        const masterKey = crypto.randomBytes(32); // TODO: Derive from password

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', masterKey, iv);

        let encrypted = cipher.update(key);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return JSON.stringify({
            encrypted: encrypted.toString('hex'),
            iv: iv.toString('hex'),
        });
    }

    /**
     * Decrypt key with user's master key
     */
    private static async decryptKeyWithUserMasterKey(
        encryptedKey: string,
        userId: string
    ): Promise<Buffer> {
        const { encrypted, iv } = JSON.parse(encryptedKey);
        const masterKey = crypto.randomBytes(32); // TODO: Derive from password

        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            masterKey,
            Buffer.from(iv, 'hex')
        );

        let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted;
    }

    /**
     * Generate time-limited access token
     */
    private static generateAccessToken(vaultId: string, ttlSeconds: number): string {
        const payload = {
            vaultId,
            issuedAt: Date.now(),
            expiresAt: Date.now() + ttlSeconds * 1000,
        };

        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    /**
     * Get authentication method string
     */
    private static getAuthMethod(authData: {
        biometricVerified?: boolean;
        pinVerified?: boolean;
    }): string {
        if (authData.biometricVerified && authData.pinVerified) {
            return 'BOTH';
        }
        if (authData.biometricVerified) {
            return 'BIOMETRIC';
        }
        if (authData.pinVerified) {
            return 'PIN';
        }
        return 'NONE';
    }
}
