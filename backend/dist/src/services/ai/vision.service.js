"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.isConfigured = exports.batchAnalyzeImages = exports.analyzeImage = exports.detectText = exports.detectLandmarks = exports.detectFaces = exports.analyzeLabels = void 0;
const vision_1 = __importDefault(require("@google-cloud/vision"));
const redis_1 = require("../../config/redis");
const logger_1 = require("../../utils/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Google Cloud Vision Service
 * Wrapper for Google Cloud Vision API for image analysis
 */
// Initialize Vision API client
let visionClient = null;
/**
 * Initialize the Vision API client
 */
const initializeClient = () => {
    if (visionClient)
        return visionClient;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsPath) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
    }
    if (!fs_1.default.existsSync(credentialsPath)) {
        throw new Error(`Google Cloud credentials file not found: ${credentialsPath}`);
    }
    visionClient = new vision_1.default.ImageAnnotatorClient({
        keyFilename: credentialsPath,
    });
    return visionClient;
};
/**
 * Analyze image labels (objects, scenes, activities)
 */
const analyzeLabels = async (imagePath, options = {}) => {
    const maxResults = options.maxResults || 10;
    const useCache = options.useCache !== false;
    // Check cache
    const cacheKey = redis_1.CacheKeys.mediaAnalysis(`labels:${imagePath}`);
    if (useCache) {
        const cached = await redis_1.cacheService.get(cacheKey);
        if (cached) {
            (0, logger_1.logAIOperation)('vision_labels_cached', { imagePath });
            return cached;
        }
    }
    try {
        const client = initializeClient();
        const [result] = await client.labelDetection(imagePath);
        const labels = result.labelAnnotations || [];
        const formattedLabels = labels
            .slice(0, maxResults)
            .map((label) => ({
            description: label.description || '',
            score: label.score || 0,
        }));
        (0, logger_1.logAIOperation)('vision_labels', {
            imagePath,
            labelsFound: formattedLabels.length,
        });
        // Cache result
        if (useCache) {
            await redis_1.cacheService.set(cacheKey, formattedLabels, 30 * 24 * 3600); // 30 days
        }
        return formattedLabels;
    }
    catch (error) {
        (0, logger_1.logAIError)('vision_labels', error, { imagePath });
        throw new Error(`Vision API label detection error: ${error.message}`);
    }
};
exports.analyzeLabels = analyzeLabels;
/**
 * Detect faces in image
 */
const detectFaces = async (imagePath, options = {}) => {
    const useCache = options.useCache !== false;
    // Check cache
    const cacheKey = redis_1.CacheKeys.mediaAnalysis(`faces:${imagePath}`);
    if (useCache) {
        const cached = await redis_1.cacheService.get(cacheKey);
        if (cached) {
            (0, logger_1.logAIOperation)('vision_faces_cached', { imagePath });
            return cached;
        }
    }
    try {
        const client = initializeClient();
        const [result] = await client.faceDetection(imagePath);
        const faces = result.faceAnnotations || [];
        const formattedFaces = faces.map((face) => {
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
        (0, logger_1.logAIOperation)('vision_faces', {
            imagePath,
            facesFound: formattedFaces.length,
        });
        // Cache result
        if (useCache) {
            await redis_1.cacheService.set(cacheKey, formattedFaces, 30 * 24 * 3600); // 30 days
        }
        return formattedFaces;
    }
    catch (error) {
        (0, logger_1.logAIError)('vision_faces', error, { imagePath });
        throw new Error(`Vision API face detection error: ${error.message}`);
    }
};
exports.detectFaces = detectFaces;
/**
 * Detect landmarks in image
 */
const detectLandmarks = async (imagePath, options = {}) => {
    const maxResults = options.maxResults || 5;
    const useCache = options.useCache !== false;
    // Check cache
    const cacheKey = redis_1.CacheKeys.mediaAnalysis(`landmarks:${imagePath}`);
    if (useCache) {
        const cached = await redis_1.cacheService.get(cacheKey);
        if (cached) {
            (0, logger_1.logAIOperation)('vision_landmarks_cached', { imagePath });
            return cached;
        }
    }
    try {
        const client = initializeClient();
        const [result] = await client.landmarkDetection(imagePath);
        const landmarks = result.landmarkAnnotations || [];
        const formattedLandmarks = landmarks.slice(0, maxResults).map((landmark) => ({
            name: landmark.description || '',
            score: landmark.score || 0,
            location: landmark.locations?.[0]?.latLng
                ? {
                    lat: landmark.locations[0].latLng.latitude || 0,
                    lng: landmark.locations[0].latLng.longitude || 0,
                }
                : undefined,
        }));
        (0, logger_1.logAIOperation)('vision_landmarks', {
            imagePath,
            landmarksFound: formattedLandmarks.length,
        });
        // Cache result
        if (useCache) {
            await redis_1.cacheService.set(cacheKey, formattedLandmarks, 30 * 24 * 3600); // 30 days
        }
        return formattedLandmarks;
    }
    catch (error) {
        (0, logger_1.logAIError)('vision_landmarks', error, { imagePath });
        throw new Error(`Vision API landmark detection error: ${error.message}`);
    }
};
exports.detectLandmarks = detectLandmarks;
/**
 * Detect text in image (OCR)
 */
const detectText = async (imagePath, options = {}) => {
    const useCache = options.useCache !== false;
    // Check cache
    const cacheKey = redis_1.CacheKeys.mediaAnalysis(`text:${imagePath}`);
    if (useCache) {
        const cached = await redis_1.cacheService.get(cacheKey);
        if (cached) {
            (0, logger_1.logAIOperation)('vision_text_cached', { imagePath });
            return cached;
        }
    }
    try {
        const client = initializeClient();
        const [result] = await client.textDetection(imagePath);
        const detections = result.textAnnotations || [];
        const text = detections[0]?.description || '';
        (0, logger_1.logAIOperation)('vision_text', {
            imagePath,
            textLength: text.length,
        });
        // Cache result
        if (useCache) {
            await redis_1.cacheService.set(cacheKey, text, 30 * 24 * 3600); // 30 days
        }
        return text;
    }
    catch (error) {
        (0, logger_1.logAIError)('vision_text', error, { imagePath });
        throw new Error(`Vision API text detection error: ${error.message}`);
    }
};
exports.detectText = detectText;
/**
 * Comprehensive image analysis (labels, faces, landmarks, text)
 */
const analyzeImage = async (imagePath, options = {}) => {
    const { includeLabels = true, includeFaces = true, includeLandmarks = true, includeText = false, useCache = true, } = options;
    const results = {};
    const promises = [];
    if (includeLabels) {
        promises.push((0, exports.analyzeLabels)(imagePath, { useCache }).then((labels) => {
            results.labels = labels;
        }));
    }
    if (includeFaces) {
        promises.push((0, exports.detectFaces)(imagePath, { useCache }).then((faces) => {
            results.faces = faces;
        }));
    }
    if (includeLandmarks) {
        promises.push((0, exports.detectLandmarks)(imagePath, { useCache }).then((landmarks) => {
            results.landmarks = landmarks;
        }));
    }
    if (includeText) {
        promises.push((0, exports.detectText)(imagePath, { useCache }).then((text) => {
            results.text = text;
        }));
    }
    await Promise.all(promises);
    return results;
};
exports.analyzeImage = analyzeImage;
/**
 * Batch analyze multiple images
 */
const batchAnalyzeImages = async (imagePaths, options = {}) => {
    const batchSize = options.batchSize || 5;
    const delayMs = options.delayMs || 500;
    const results = [];
    for (let i = 0; i < imagePaths.length; i += batchSize) {
        const batch = imagePaths.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(async (imagePath) => ({
            imagePath,
            analysis: await (0, exports.analyzeImage)(imagePath, options),
        })));
        results.push(...batchResults);
        // Delay between batches
        if (i + batchSize < imagePaths.length) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return results;
};
exports.batchAnalyzeImages = batchAnalyzeImages;
/**
 * Helper: Convert likelihood enum to score
 */
const getLikelihoodScore = (likelihood) => {
    const scores = {
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
const isConfigured = () => {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    return !!credentialsPath && fs_1.default.existsSync(credentialsPath);
};
exports.isConfigured = isConfigured;
/**
 * Test Vision API connection
 */
const testConnection = async () => {
    try {
        // Create a simple test image (1x1 white pixel)
        const testImagePath = path_1.default.join(__dirname, 'test-image.png');
        // For actual testing, you'd need a real image
        // This is just a placeholder
        return (0, exports.isConfigured)();
    }
    catch (error) {
        return false;
    }
};
exports.testConnection = testConnection;
exports.default = {
    analyzeLabels: exports.analyzeLabels,
    detectFaces: exports.detectFaces,
    detectLandmarks: exports.detectLandmarks,
    detectText: exports.detectText,
    analyzeImage: exports.analyzeImage,
    batchAnalyzeImages: exports.batchAnalyzeImages,
    isConfigured: exports.isConfigured,
    testConnection: exports.testConnection,
};
