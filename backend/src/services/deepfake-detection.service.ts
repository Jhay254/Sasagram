import axios from 'axios';
import prisma from '../db/prisma';

/**
 * Deepfake Detection Service - Microsoft Video Authenticator
 * Strict threshold: >70% confidence = flagged
 * Automatic decision: No appeals
 */
export class DeepfakeDetectionService {
    private apiEndpoint: string;
    private apiKey: string;
    private strictThreshold = 0.7; // 70% confidence threshold

    constructor() {
        // Microsoft Video Authenticator API
        this.apiEndpoint =
            process.env.MICROSOFT_AUTHENTICATOR_ENDPOINT || 'https://api.videoauthenticator.microsoft.com';
        this.apiKey = process.env.MICROSOFT_AUTHENTICATOR_KEY || '';
    }

    /**
     * Analyze image for deepfake manipulation
     */
    async analyzeImage(userId: string, contentId: string, imageBuffer: Buffer) {
        try {
            // Call Microsoft Video Authenticator API
            const result = await this.callMicrosoftAPI(imageBuffer, 'image');

            // Strict threshold: >0.7 = flagged automatically
            const isDeepfake = result.confidenceScore > this.strictThreshold;

            // Create analysis record (automatic decision, no appeals)
            const analysis = await prisma.deepfakeAnalysis.create({
                data: {
                    userId,
                    contentId,
                    contentType: 'IMAGE',
                    isDeepfake,
                    confidenceScore: result.confidenceScore,
                    detectionMethod: 'MICROSOFT_AUTHENTICATOR',
                    flagged: isDeepfake,
                    autoDecision: true, // No appeals
                    analysisData: result.details,
                    manipulationType: result.manipulationType || 'NONE',
                },
            });

            // Update user's trust score
            if (!isDeepfake) {
                await this.updateUserTrustScore(userId, result.confidenceScore);
            }

            return analysis;
        } catch (error) {
            console.error('Error analyzing image:', error);
            throw new Error('Failed to analyze image for deepfakes');
        }
    }

    /**
     * Analyze video for deepfake manipulation
     */
    async analyzeVideo(userId: string, contentId: string, videoBuffer: Buffer) {
        try {
            // Call Microsoft Video Authenticator API
            const result = await this.callMicrosoftAPI(videoBuffer, 'video');

            const isDeepfake = result.confidenceScore > this.strictThreshold;

            const analysis = await prisma.deepfakeAnalysis.create({
                data: {
                    userId,
                    contentId,
                    contentType: 'VIDEO',
                    isDeepfake,
                    confidenceScore: result.confidenceScore,
                    detectionMethod: 'MICROSOFT_AUTHENTICATOR',
                    flagged: isDeepfake,
                    autoDecision: true,
                    analysisData: result.details,
                    manipulationType: result.manipulationType || 'NONE',
                },
            });

            if (!isDeepfake) {
                await this.updateUserTrustScore(userId, result.confidenceScore);
            }

            return analysis;
        } catch (error) {
            console.error('Error analyzing video:', error);
            throw new Error('Failed to analyze video for deepfakes');
        }
    }

    /**
     * Get user's deepfake analysis history
     */
    async getUserAnalyses(userId: string) {
        return await prisma.deepfakeAnalysis.findMany({
            where: { userId },
            orderBy: { analyzedAt: 'desc' },
        });
    }

    /**
     * Get deepfake statistics for user
     */
    async getUserDeepfakeStats(userId: string) {
        const analyses = await prisma.deepfakeAnalysis.findMany({
            where: { userId },
        });

        const totalAnalyses = analyses.length;
        const flaggedCount = analyses.filter((a) => a.flagged).length;
        const avgConfidence =
            analyses.reduce((sum, a) => sum + a.confidenceScore, 0) / (totalAnalyses || 1);

        // Authenticity score (inverse of deepfake confidence)
        const authenticityScore = 1 - avgConfidence;

        return {
            totalAnalyses,
            flaggedCount,
            cleanCount: totalAnalyses - flaggedCount,
            avgConfidenceScore: avgConfidence,
            authenticityScore,
            flaggedPercentage: (flaggedCount / (totalAnalyses || 1)) * 100,
        };
    }

    // ========== Private Helper Methods ==========

    /**
     * Call Microsoft Video Authenticator API
     */
    private async callMicrosoftAPI(
        contentBuffer: Buffer,
        contentType: 'image' | 'video'
    ): Promise<{
        confidenceScore: number;
        manipulationType: string | null;
        details: any;
    }> {
        // NOTE: This is a placeholder implementation
        // In production, integrate with actual Microsoft Video Authenticator API

        try {
            const response = await axios.post(
                `${this.apiEndpoint}/analyze`,
                {
                    content: contentBuffer.toString('base64'),
                    contentType,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key': this.apiKey,
                    },
                }
            );

            return {
                confidenceScore: response.data.manipulationScore || 0,
                manipulationType: response.data.manipulationType,
                details: response.data,
            };
        } catch (error) {
            console.error('Microsoft API error:', error);

            // Fallback: Return low confidence (assume authentic) if API fails
            return {
                confidenceScore: 0.1,
                manipulationType: null,
                details: { error: 'API unavailable', assumedAuthentic: true },
            };
        }
    }

    /**
     * Update user's trust score based on analysis
     */
    private async updateUserTrustScore(userId: string, confidenceScore: number) {
        // This will be used by TrustBadgeService to calculate badges
        // Lower confidence score = more authentic = better trust score
        const authenticityScore = 1 - confidenceScore;

        // Store in user metadata or separate table
        // For now, trust badges will be calculated on-demand
    }
}
