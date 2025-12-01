"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBiographyGeneration = processBiographyGeneration;
const timeline_service_1 = require("../services/biography/timeline.service");
const chapter_service_1 = require("../services/biography/chapter.service");
const narrative_service_1 = require("../services/biography/narrative.service");
const sentiment_service_1 = require("../services/biography/sentiment.service");
const logger_1 = require("../utils/logger");
/**
 * Process biography generation job
 */
async function processBiographyGeneration(jobData, updateProgress) {
    const startTime = Date.now();
    const { userId, style, options } = jobData;
    logger_1.logger.info(`Starting biography generation for user ${userId}`);
    try {
        // Step 1: Build Timeline (10%)
        await updateProgress(10);
        logger_1.logger.info('Step 1: Constructing timeline...');
        const timeline = await timeline_service_1.timelineService.constructTimeline(userId);
        // Step 2: Categorize Events (30%)
        await updateProgress(30);
        logger_1.logger.info('Step 2: Categorizing events...');
        const enrichedTimeline = await timeline_service_1.timelineService.enrichTimeline(timeline);
        // Step 3: Sentiment Analysis (50%)
        if (options.includeSentiment) {
            await updateProgress(50);
            logger_1.logger.info('Step 3: Analyzing sentiment...');
            await sentiment_service_1.sentimentService.generateMoodTimeline(enrichedTimeline.events);
        }
        // Step 4: Generate Chapters (70%)
        await updateProgress(70);
        logger_1.logger.info('Step 4: Generating chapters...');
        const chapters = await chapter_service_1.chapterService.generateChapters(enrichedTimeline, options.chapterOptions);
        // Step 5: Generate Narrative (90%)
        await updateProgress(90);
        logger_1.logger.info('Step 5: Generating narrative...');
        const biography = await narrative_service_1.narrativeService.generateBiography(chapters, enrichedTimeline, style);
        // Step 6: Complete (100%)
        await updateProgress(100);
        const generationTime = Date.now() - startTime;
        logger_1.logger.info(`Biography generation complete: ${biography.id}`);
        return {
            biographyId: biography.id,
            totalWords: biography.metadata.totalWords,
            totalChapters: biography.metadata.totalChapters,
            cost: biography.metadata.cost,
            generationTime,
        };
    }
    catch (error) {
        logger_1.logger.error('Biography generation failed:', error);
        throw error;
    }
}
