import { ImageAnnotatorClient } from '@google-cloud/vision';
import { cacheService, CacheKeys } from '../../config/redis';
import { logAIOperation, logAIError } from '../../utils/logger';
import path from 'path';
import fs from 'fs';

/**
 * Google Cloud Vision Service
 * Wrapper for Google Cloud Vision API for image analysis
 */

// Initialize Vision API client
let visionClient: ImageAnnotatorClient | null = null;

/**
 * Initialize the Vision API client
 */
const initializeClient = (): ImageAnnotatorClient => {
    if (visionClient) return visionClient;

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!credentialsPath) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
    }

    if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Google Cloud credentials file not found: ${credentialsPath}`);
    }

    visionClient = new ImageAnnotatorClient({
        keyFilename: credentialsPath,
    });

    return visionClient;
};

/**
 * Analyze image labels (objects, scenes, activities)
 */
export const analyzeLabels = async (
    imagePath: string,
    options: {
        maxResults?: number;
        useCache?: boolean;
    } = {}
): Promise<Array<{ description: string; score: number }>> => {
    const maxResults = options.maxResults || 10;
    const useCache = options.useCache !== false;

    // Check cache
    const cacheKey = CacheKeys.mediaAnalysis(`labels:${imagePath}`);
    if (useCache) {
        const cached = await cacheService.get<Array<{ description: string; score: number }>>(cacheKey);
        if (cached) {
            logAIOperation('vision_labels_cached', { imagePath });
            return cached;
        }
    }

    try {
        const client = initializeClient();
        const [result] = await client.labelDetection(imagePath);
        const labels = result.labelAnnotations || [];

        const formattedLabels = labels
            .slice(0, maxResults)
            .map((label: any) => ({
                description: label.description || '',
                score: label.score || 0,
            }));

        logAIOperation('vision_labels', {
            imagePath,
            labelsFound: formattedLabels.length,
        });

        // Cache result
        if (useCache) {
            await cacheService.set(cacheKey, formattedLabels, 30 * 24 * 3600); // 30 days
        }

        return formattedLabels;
    } catch (error: any) {
        logAIError('vision_labels', error, { imagePath });
        throw new Error(`Vision API label detection error: ${error.message}`);
    }
};

/**
 * Detect faces in image
 */
export const detectFaces = async (
    imagePath: string,
    options: {
        useCache?: boolean;
    } = {}
): Promise<Array<{
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
    emotions: {
        joy: number;
        sorrow: number;
        anger: number;
        surprise: number;
    };
}>> => {
    const useCache = options.useCache !== false;

    // Check cache
    const cacheKey = CacheKeys.mediaAnalysis(`faces:${imagePath}`);
    if (useCache) {
        const cached = await cacheService.get<any>(cacheKey);
        if (cached) {
            logAIOperation('vision_faces_cached', { imagePath });
            return cached;
        }
    }

    try {
        const client = initializeClient();
        const [result] = await client.faceDetection(imagePath);
        const faces = result.faceAnnotations || [];

        const formattedFaces = faces.map((face: any) => {
            const vertices = face.boundingPoly?.vertices || [];
            const boundingBox = {
                x: vertices[0]?.x || 0,
                y: vertices[0]?.y || 0,
                width: (vertices[2]?.x || 0) - (vertices[0]?.x || 0),
                height: (vertices[2]?.y || 0) - (vertices[0]?.y || 0),
            };

            return {
                boundingBox,
                confidence: face.detectionConfidence || 0,
                emotions: {
                    joy: getLikelihoodScore(face.joyLikelihood),
                    sorrow: getLikelihoodScore(face.sorrowLikelihood),
                    anger: getLikelihoodScore(face.angerLikelihood),
                    surprise: getLikelihoodScore(face.surpriseLikelihood),
                },
            };
        });

        logAIOperation('vision_faces', {
            imagePath,
            facesFound: formattedFaces.length,
        });

        // Cache result
        if (useCache) {
            await cacheService.set(cacheKey, formattedFaces, 30 * 24 * 3600); // 30 days
        }

        return formattedFaces;
    } catch (error: any) {
        logAIError('vision_faces', error, { imagePath });
        throw new Error(`Vision API face detection error: ${error.message}`);
    }
};

/**
 * Detect landmarks in image
 */
export const detectLandmarks = async (
    imagePath: string,
    options: {
        maxResults?: number;
        useCache?: boolean;
    } = {}
): Promise<Array<{ name: string; score: number; location?: { lat: number; lng: number } }>> => {
    const maxResults = options.maxResults || 5;
    const useCache = options.useCache !== false;

    // Check cache
    const cacheKey = CacheKeys.mediaAnalysis(`landmarks:${imagePath}`);
    if (useCache) {
        const cached = await cacheService.get<any>(cacheKey);
        if (cached) {
            logAIOperation('vision_landmarks_cached', { imagePath });
            return cached;
        }
    }

    try {
        const client = initializeClient();
        const [result] = await client.landmarkDetection(imagePath);
        const landmarks = result.landmarkAnnotations || [];

        const formattedLandmarks = landmarks.slice(0, maxResults).map((landmark: any) => ({
            name: landmark.description || '',
            score: landmark.score || 0,
            location: landmark.locations?.[0]?.latLng
                ? {
                    lat: landmark.locations[0].latLng.latitude || 0,
                    lng: landmark.locations[0].latLng.longitude || 0,
                }
                : undefined,
        }));

        logAIOperation('vision_landmarks', {
            imagePath,
            landmarksFound: formattedLandmarks.length,
        });

        // Cache result
        if (useCache) {
            await cacheService.set(cacheKey, formattedLandmarks, 30 * 24 * 3600); // 30 days
        }

        return formattedLandmarks;
    } catch (error: any) {
        logAIError('vision_landmarks', error, { imagePath });
        throw new Error(`Vision API landmark detection error: ${error.message}`);
    }
};

/**
 * Detect text in image (OCR)
 */
export const detectText = async (
    imagePath: string,
    options: {
        useCache?: boolean;
    } = {}
): Promise<string> => {
    const useCache = options.useCache !== false;

    // Check cache
    const cacheKey = CacheKeys.mediaAnalysis(`text:${imagePath}`);
    if (useCache) {
        const cached = await cacheService.get<string>(cacheKey);
        if (cached) {
            logAIOperation('vision_text_cached', { imagePath });
            return cached;
        }
    }

    try {
        const client = initializeClient();
        const [result] = await client.textDetection(imagePath);
        const detections = result.textAnnotations || [];
        const text = detections[0]?.description || '';

        logAIOperation('vision_text', {
            imagePath,
            textLength: text.length,
        });

        // Cache result
        if (useCache) {
            await cacheService.set(cacheKey, text, 30 * 24 * 3600); // 30 days
        }

        return text;
    } catch (error: any) {
        logAIError('vision_text', error, { imagePath });
        throw new Error(`Vision API text detection error: ${error.message}`);
    }
};

/**
 * Comprehensive image analysis (labels, faces, landmarks, text)
 */
export const analyzeImage = async (
    imagePath: string,
    options: {
        includeLabels?: boolean;
        includeFaces?: boolean;
        includeLandmarks?: boolean;
        includeText?: boolean;
        useCache?: boolean;
    } = {}
): Promise<{
    labels?: Array<{ description: string; score: number }>;
    faces?: Array<any>;
    landmarks?: Array<any>;
    text?: string;
}> => {
    const {
        includeLabels = true,
        includeFaces = true,
        includeLandmarks = true,
        includeText = false,
        useCache = true,
    } = options;

    const results: any = {};

    const promises: Promise<void>[] = [];

    if (includeLabels) {
        promises.push(
            analyzeLabels(imagePath, { useCache }).then((labels) => {
                results.labels = labels;
            })
        );
    }

    if (includeFaces) {
        promises.push(
            detectFaces(imagePath, { useCache }).then((faces) => {
                results.faces = faces;
            })
        );
    }

    if (includeLandmarks) {
        promises.push(
            detectLandmarks(imagePath, { useCache }).then((landmarks) => {
                results.landmarks = landmarks;
            })
        );
    }

    if (includeText) {
        promises.push(
            detectText(imagePath, { useCache }).then((text) => {
                results.text = text;
            })
        );
    }

    await Promise.all(promises);

    return results;
};

/**
 * Batch analyze multiple images
 */
export const batchAnalyzeImages = async (
    imagePaths: string[],
    options: {
        includeLabels?: boolean;
        includeFaces?: boolean;
        includeLandmarks?: boolean;
        includeText?: boolean;
        useCache?: boolean;
        batchSize?: number;
        delayMs?: number;
    } = {}
): Promise<Array<{ imagePath: string; analysis: any }>> => {
    const batchSize = options.batchSize || 5;
    const delayMs = options.delayMs || 500;

    const results: Array<{ imagePath: string; analysis: any }> = [];

    for (let i = 0; i < imagePaths.length; i += batchSize) {
        const batch = imagePaths.slice(i, i + batchSize);

        const batchResults = await Promise.all(
            batch.map(async (imagePath) => ({
                imagePath,
                analysis: await analyzeImage(imagePath, options),
            }))
        );

        results.push(...batchResults);

        // Delay between batches
        if (i + batchSize < imagePaths.length) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return results;
};

/**
 * Helper: Convert likelihood enum to score
 */
const getLikelihoodScore = (likelihood: string | null | undefined): number => {
    const scores: Record<string, number> = {
        VERY_UNLIKELY: 0.1,
        UNLIKELY: 0.3,
        POSSIBLE: 0.5,
        LIKELY: 0.7,
        VERY_LIKELY: 0.9,
    };
    return scores[likelihood || ''] || 0;
};

/**
 * Check if Vision API is configured
 */
export const isConfigured = (): boolean => {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    return !!credentialsPath && fs.existsSync(credentialsPath);
};

/**
 * Test Vision API connection
 */
export const testConnection = async (): Promise<boolean> => {
    try {
        // Create a simple test image (1x1 white pixel)
        const testImagePath = path.join(__dirname, 'test-image.png');
        // For actual testing, you'd need a real image
        // This is just a placeholder
        return isConfigured();
    } catch (error) {
        return false;
    }
};

export default {
    analyzeLabels,
    detectFaces,
    detectLandmarks,
    detectText,
    analyzeImage,
    batchAnalyzeImages,
    isConfigured,
    testConnection,
};
