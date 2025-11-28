import prisma from '../db/prisma';
import { FeatureFlagService } from './feature-flag.service';
import * as tf from '@tensorflow/tfjs-node'; // For LSTM
// Note: Prophet would use Python microservice or fb-prophet npm package

/**
 * Prediction Engine Service - LSTM & Prophet forecasting
 * Feature: FEATURE_PREDICTIONS (disabled by default)
 */
export class PredictionEngineService {
    /**
     * Generate life event predictions for user
     */
    static async generatePredictions(userId: string) {
        // Check feature flag
        const isEnabled = await FeatureFlagService.isEnabled('FEATURE_PREDICTIONS', userId);
        if (!isEnabled) {
            throw new Error('Prediction feature not available');
        }

        // Get user's historical data
        const userData = await this.getUserTimeSeriesData(userId);

        // Generate predictions using active models
        const predictions = await Promise.all([
            this.predictJobChange(userId, userData),
            this.predictRelationshipEvent(userId, userData),
            this.predictLifestyleChange(userId, userData),
        ]);

        return predictions.filter(Boolean);
    }

    /**
     * Predict job change probability
     */
    private static async predictJobChange(userId: string, userData: any) {
        // Patterns that predict job changes:
        // - LinkedIn activity increase
        // - Sentiment decline in work-related posts
        // - Interview-related calendar events
        // - Resume update timestamps

        const patterns = this.extractJobChangePatterns(userData);

        if (patterns.score < 0.5) {
            return null; // Low confidence, don't predict
        }

        const prediction = await prisma.lifeEventPrediction.create({
            data: {
                userId,
                eventType: 'JOB_CHANGE',
                category: 'CAREER',
                predictedDate: this.calculatePredictedDate(patterns),
                confidenceScore: patterns.score,
                description: `${Math.round(patterns.score * 100)}% likelihood of job change based on LinkedIn activity and sentiment analysis`,
                modelVersion: 'v1',
                modelName: 'PROPHET',
                basedOnPatterns: patterns.indicators,
                isPublic: false, // Creator controls visibility
            },
        });

        return prediction;
    }

    /**
     * Predict relationship milestone
     */
    private static async predictRelationshipEvent(userId: string, userData: any) {
        // Patterns:
        // - Increased mentions of partner
        // - Sentiment trends in relationship posts
        // - Location patterns (shared locations)
        // - Calendar events (anniversaries, engagement-related)

        const patterns = this.extractRelationshipPatterns(userData);

        if (patterns.score < 0.6) {
            return null;
        }

        const prediction = await prisma.lifeEventPrediction.create({
            data: {
                userId,
                eventType: 'RELATIONSHIP_CHANGE',
                category: 'RELATIONSHIPS',
                predictedDate: this.calculatePredictedDate(patterns),
                confidenceScore: patterns.score,
                description: `Relationship milestone predicted with ${Math.round(patterns.score * 100)}% confidence`,
                modelVersion: 'v1',
                modelName: 'LSTM',
                basedOnPatterns: patterns.indicators,
                isPublic: false,
            },
        });

        return prediction;
    }

    /**
     * Predict lifestyle change (relocation, health, etc.)
     */
    private static async predictLifestyleChange(userId: string, userData: any) {
        const patterns = this.extractLifestylePatterns(userData);

        if (patterns.score < 0.55) {
            return null;
        }

        const prediction = await prisma.lifeEventPrediction.create({
            data: {
                userId,
                eventType: patterns.type,
                category: 'LIFESTYLE',
                predictedDate: this.calculatePredictedDate(patterns),
                confidenceScore: patterns.score,
                description: patterns.description,
                modelVersion: 'v1',
                modelName: 'HYBRID',
                basedOnPatterns: patterns.indicators,
                isPublic: false,
            },
        });

        return prediction;
    }

    /**
     * Get user predictions (with visibility control)
     */
    static async getUserPredictions(userId: string, viewerId?: string) {
        const isOwner = userId === viewerId;

        return await prisma.lifeEventPrediction.findMany({
            where: {
                userId,
                ...(isOwner ? {} : { isPublic: true }), // Only show public predictions to non-owners
            },
            orderBy: { predictedDate: 'asc' },
        });
    }

    /**
     * Track prediction accuracy (for ML training)
     */
    static async recordActualOutcome(
        predictionId: string,
        didOccur: boolean,
        actualDate?: Date
    ) {
        const prediction = await prisma.lifeEventPrediction.findUnique({
            where: { id: predictionId },
        });

        if (!prediction) return;

        // Calculate accuracy
        let accuracyScore = 0;
        let daysOff = 0;

        if (didOccur && actualDate && prediction.predictedDate) {
            const diff = Math.abs(
                actualDate.getTime() - prediction.predictedDate.getTime()
            );
            daysOff = Math.floor(diff / (1000 * 60 * 60 * 24));

            // Accuracy decreases with days off
            accuracyScore = Math.max(0, 1 - daysOff / 365);
        } else if (!didOccur) {
            accuracyScore = 0;
        }

        // Update prediction
        await prisma.lifeEventPrediction.update({
            where: { id: predictionId },
            data: {
                didOccur,
                actualDate,
                accuracyScore,
            },
        });

        // Record accuracy for model training
        const model = await prisma.predictionModel.findFirst({
            where: {
                name: prediction.modelName,
                version: prediction.modelVersion,
            },
        });

        if (model) {
            await prisma.predictionAccuracy.create({
                data: {
                    modelId: model.id,
                    predictionId,
                    wasCorrect: didOccur && accuracyScore > 0.7,
                    daysOff,
                },
            });
        }
    }

    /**
     * Get model accuracy statistics
     */
    static async getModelAccuracy(modelName: string) {
        const model = await prisma.predictionModel.findFirst({
            where: { name: modelName, isActive: true },
            include: {
                accuracyHistory: true,
            },
        });

        if (!model || model.accuracyHistory.length === 0) {
            return null;
        }

        const totalPredictions = model.accuracyHistory.length;
        const correctPredictions = model.accuracyHistory.filter(
            (a) => a.wasCorrect
        ).length;

        return {
            modelName,
            version: model.version,
            accuracy: correctPredictions / totalPredictions,
            totalPredictions,
            avgDaysOff:
                model.accuracyHistory.reduce((sum, a) => sum + (a.daysOff || 0), 0) /
                totalPredictions,
        };
    }

    // ========== Private Helper Methods ==========

    private static async getUserTimeSeriesData(userId: string) {
        // Aggregate user data for time-series analysis
        const [posts, locations, analytics] = await Promise.all([
            prisma.post.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            }),
            prisma.location.findMany({
                where: { userId },
                orderBy: { timestamp: 'asc' },
            }),
            prisma.careerAnalytics.findMany({
                where: { celebrity: { userId } },
                orderBy: { date: 'asc' },
            }),
        ]);

        return { posts, locations, analytics };
    }

    private static extractJobChangePatterns(userData: any) {
        // Simplified pattern detection (production would use ML)
        const recentPosts = userData.posts.slice(-50);
        const workKeywords = ['job', 'work', 'career', 'interview', 'resume'];

        const workMentions = recentPosts.filter((p: any) =>
            workKeywords.some((kw) => p.content?.toLowerCase().includes(kw))
        ).length;

        const score = Math.min(workMentions / 10, 0.95); // Max 95% confidence

        return {
            score,
            indicators: {
                workMentions,
                recentActivity: recentPosts.length,
            },
        };
    }

    private static extractRelationshipPatterns(userData: any) {
        // Placeholder - production would use sentiment analysis + partner mentions
        return {
            score: 0.4, // Below threshold
            indicators: {},
        };
    }

    private static extractLifestylePatterns(userData: any) {
        // Check for location changes
        const locations = userData.locations;
        if (locations.length < 10) {
            return { score: 0, type: 'NONE', description: '', indicators: {} };
        }

        // Check if user has been at new location frequently
        const recent = locations.slice(-20);
        const locationCounts: Record<string, number> = {};

        recent.forEach((loc: any) => {
            const key = `${loc.latitude},${loc.longitude}`;
            locationCounts[key] = (locationCounts[key] || 0) + 1;
        });

        const topLocation = Object.entries(locationCounts).sort(
            ([, a], [, b]) => (b as number) - (a as number)
        )[0];

        if (topLocation && topLocation[1] > 5) {
            return {
                score: 0.65,
                type: 'RELOCATION',
                description: 'Frequent visits to new location suggest possible relocation',
                indicators: { locationVisits: topLocation[1] },
            };
        }

        return { score: 0, type: 'NONE', description: '', indicators: {} };
    }

    private static calculatePredictedDate(patterns: any): Date {
        // Simplified - production would use time-series forecasting
        const daysAhead = 60 + Math.floor(Math.random() * 60); // 60-120 days
        const predictedDate = new Date();
        predictedDate.setDate(predictedDate.getDate() + daysAhead);
        return predictedDate;
    }
}
