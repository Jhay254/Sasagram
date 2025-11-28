import prisma from '../db/prisma';
import crypto from 'crypto';

const NDA_V1_0 = `
LIFELINE SHADOW SELF ANALYSIS - NON-DISCLOSURE AGREEMENT

Version 1.0
Effective Date: November 2025

This Non-Disclosure Agreement ("Agreement") is entered into between:
- Lifeline, Inc., a corporation ("Company")
- The subscribing user ("Subscriber")

1. CONFIDENTIAL INFORMATION

   The Shadow Self Report ("Report") contains highly sensitive personal information
   that the Subscriber has intentionally deleted, hidden, or removed from their
   public biography. This information is confidential and proprietary.

2. NON-DISCLOSURE OBLIGATIONS

   The Subscriber agrees to:
   a) NOT share, distribute, publish, or disclose any content from Shadow Self Reports
   b) NOT screenshot, photograph, record, or copy Report content in any form
   c) NOT discuss specific deleted content details with third parties
   d) Maintain strict confidentiality of all Report information
   e) Use Reports solely for personal self-reflection and growth

3. SECURITY MEASURES

   The Subscriber acknowledges and agrees that:
   a) All access is logged with device fingerprints, IP addresses, and timestamps
   b) Forensic watermarks are embedded in all Reports to trace unauthorized sharing
   c) Screenshot attempts will result in immediate account suspension
   d) Report access requires biometric authentication
   e) Violations may result in legal action and civil damages

4. PROHIBITED CONDUCT

   The Subscriber shall NOT:
   a) Attempt to bypass or disable security measures
   b) Share login credentials or biometric data
   c) Access Reports on behalf of third parties
   d) Use Report content for blackmail, defamation, or harassment
   e) Create derivative works from Report content

5. TERMINATION

   This Agreement:
   a) Remains in effect indefinitely unless revoked by Company
   b) Survives termination of Platinum subscription
   c) Cannot be unilaterally terminated by Subscriber

6. REMEDIES FOR BREACH

   Breach of this Agreement may result in:
   a) Immediate permanent termination of Platinum subscription without refund
   b) Legal action for injunctive relief
   c) Civil damages of up to $100,000 per violation
   d) Criminal prosecution where applicable under state/federal law
   e) Attorney fees and court costs

7. PRIVACY & DATA PROTECTION

   The Company will:
   a) Protect Reports with industry-standard encryption
   b) Auto-delete Reports after 30 days
   c) Permanently delete deleted content after 90 days (GDPR compliance)
   d) Not share Report content with third parties except as required by law

8. MENTAL HEALTH DISCLAIMER

   The Subscriber acknowledges:
   a) Reports may contain emotionally distressing content
   b) Company is not responsible for psychological impact
   c) Professional mental health support is recommended
   d) Crisis resources are provided for emergencies

9. LIMITATION OF LIABILITY

   TO THE MAXIMUM EXTENT PERMITTED BY LAW:
   a) Company is not liable for Report content accuracy
   b) Company is not liable for psychological, emotional, or financial harm
   c) Subscriber uses Shadow Self feature at their own risk
   d) Maximum Company liability is amount paid for Platinum subscription

10. GOVERNING LAW

    This Agreement is governed by the laws of Delaware, USA.
    Disputes shall be resolved through binding arbitration.

11. ENTIRE AGREEMENT

    This Agreement constitutes the entire agreement between parties
    regarding Shadow Self Reports and supersedes all prior agreements.

SUBSCRIBER ACKNOWLEDGMENT:

By providing biometric authentication below, the Subscriber certifies that they have:
✓ Read this entire Agreement carefully
✓ Understand all terms and obligations
✓ Voluntarily agree to be bound by these terms
✓ Are of legal age (18+) to enter this Agreement

Biometric Signature: [Required]
Date: {date}
IP Address: {ip}
Device: {device}
Location: {location}

FOR COMPANY USE ONLY:
NDA Version: 1.0
Checksum: {checksum}
Signature ID: {signatureId}
`.trim();

export class NDAService {
    /**
     * Get current NDA version
     */
    static async getCurrentNDA() {
        return {
            version: '1.0',
            text: NDA_V1_0,
            checksum: this.calculateChecksum(NDA_V1_0),
            requiresBiometric: true,
            minimumReadTime: 30, // seconds
            requiresScrollToBottom: true,
        };
    }

    /**
     * Sign NDA with biometric authentication
     */
    static async signNDA(
        userId: string,
        biometricData: any,
        deviceInfo: any,
        readingMetrics: any
    ) {
        const nda = await this.getCurrentNDA();

        // Validate reading time
        if (readingMetrics.timeSpentReading < nda.minimumReadTime) {
            throw new Error(`You must spend at least ${nda.minimumReadTime} seconds reading the NDA`);
        }

        // Validate scroll
        if (!readingMetrics.scrolledToBottom) {
            throw new Error('You must scroll to the bottom of the NDA');
        }

        // Verify biometric (placeholder - actual implementation depends on platform)
        const biometricHash = this.hashBiometric(biometricData);

        // Create signature
        const signature = await prisma.nDASignature.create({
            data: {
                userId,
                ndaVersion: nda.version,
                ndaText: nda.text,
                ndaChecksum: nda.checksum,
                signedAt: new Date(),
                ipAddress: deviceInfo.ipAddress || '0.0.0.0',
                deviceInfo: JSON.stringify(deviceInfo),
                geoLocation: deviceInfo.geoLocation,
                userAgent: deviceInfo.userAgent || '',
                biometricType: biometricData.type, // FACE_ID, TOUCH_ID, etc.
                biometricHash: biometricHash,
                biometricVerified: true,
                isValid: true,
                scrolledToBottom: readingMetrics.scrolledToBottom,
                timeSpentReading: readingMetrics.timeSpentReading,
                acceptanceMethod: 'BIOMETRIC',
            },
        });

        // Update Platinum subscription
        await prisma.platinumSubscription.update({
            where: { userId },
            data: {
                ndaSignedAt: new Date(),
                ndaVersion: nda.version,
                ndaIsValid: true,
            },
        });

        return signature;
    }

    /**
     * Check if user has valid NDA signature
     */
    static async hasValidNDA(userId: string): Promise<boolean> {
        const subscription = await prisma.platinumSubscription.findUnique({
            where: { userId },
        });

        if (!subscription || !subscription.ndaIsValid) {
            return false;
        }

        // Check if signature exists and is valid
        const signature = await prisma.nDASignature.findFirst({
            where: {
                userId,
                isValid: true,
                ndaVersion: '1.0', // Current version
            },
            orderBy: { signedAt: 'desc' },
        });

        return !!signature;
    }

    /**
     * Get user's NDA signature
     */
    static async getUserSignature(userId: string) {
        return await prisma.nDASignature.findFirst({
            where: {
                userId,
                isValid: true,
            },
            orderBy: { signedAt: 'desc' },
        });
    }

    /**
     * Revoke NDA (admin action)
     */
    static async revokeNDA(userId: string, reason: string) {
        await prisma.nDASignature.updateMany({
            where: {
                userId,
                isValid: true,
            },
            data: {
                isValid: false,
                revokedAt: new Date(),
                revokeReason: reason,
            },
        });

        await prisma.platinumSubscription.update({
            where: { userId },
            data: {
                ndaIsValid: false,
            },
        });
    }

    /**
     * Calculate NDA checksum for integrity
     */
    private static calculateChecksum(text: string): string {
        return crypto.createHash('sha256').update(text).digest('hex');
    }

    /**
     * Hash biometric data (one-way)
     */
    private static hashBiometric(biometricData: any): string {
        const dataString = JSON.stringify(biometricData);
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }

    /**
     * Verify NDA version is current
     */
    static async verifyNDAVersion(userId: string): Promise<boolean> {
        const signature = await this.getUserSignature(userId);
        if (!signature) return false;

        const currentNDA = await this.getCurrentNDA();
        return signature.ndaVersion === currentNDA.version;
    }
}
