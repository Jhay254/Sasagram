"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timelineService = exports.TimelineService = void 0;
const client_1 = require("@prisma/client");
const biography_1 = require("../../types/biography");
const logger_1 = require("../../utils/logger");
const categorization_service_1 = require("./categorization.service");
const prisma = new client_1.PrismaClient();
class TimelineService {
    /**
     * Construct a full timeline for a user
     */
    async constructTimeline(userId) {
        logger_1.logger.info(`Constructing timeline for user ${userId}`);
        // 1. Fetch all raw events
        const events = await this.fetchAllEvents(userId);
        // 2. Sort chronologically
        const sortedEvents = this.sortEvents(events);
        // 3. Generate clusters
        const clusters = this.generateClusters(sortedEvents);
        // 4. Detect gaps
        const gaps = this.detectGaps(sortedEvents);
        // 5. Create timeline object
        const timeline = {
            userId,
            events: sortedEvents,
            clusters,
            gaps,
            startDate: sortedEvents.length > 0 ? sortedEvents[0].timestamp : new Date(),
            endDate: sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].timestamp : new Date(),
        };
        logger_1.logger.info(`Timeline constructed with ${sortedEvents.length} events, ${clusters.length} clusters, and ${gaps.length} gaps`);
        return timeline;
    }
    /**
     * Fetch events from all sources
     */
    async fetchAllEvents(userId) {
        const [contents, emails, media] = await Promise.all([
            prisma.content.findMany({ where: { userId } }),
            prisma.emailMetadata.findMany({ where: { userId } }),
            prisma.media.findMany({ where: { userId, takenAt: { not: null } } }),
        ]);
        const timelineEvents = [];
        // Process Social Content
        for (const content of contents) {
            timelineEvents.push({
                id: content.id,
                userId,
                sourceType: biography_1.EventSourceType.POST,
                sourceId: content.id,
                timestamp: content.timestamp,
                content: content.text || '',
                metadata: {
                    provider: content.provider,
                    platformId: content.platformId,
                    engagement: content.engagementLikes,
                    mediaUrls: content.mediaUrls,
                },
            });
        }
        // Process Emails
        for (const email of emails) {
            timelineEvents.push({
                id: email.id,
                userId,
                sourceType: biography_1.EventSourceType.EMAIL,
                sourceId: email.id,
                timestamp: email.timestamp,
                content: email.subject || '',
                metadata: {
                    provider: email.provider,
                    sender: email.sender,
                    recipient: email.recipient,
                    category: email.category,
                },
            });
        }
        // Process Media (Photos/Videos)
        for (const item of media) {
            if (!item.takenAt)
                continue;
            timelineEvents.push({
                id: item.id,
                userId,
                sourceType: biography_1.EventSourceType.MEDIA,
                sourceId: item.id,
                timestamp: item.takenAt,
                content: '', // Media often has no text content
                metadata: {
                    provider: item.provider,
                    mimeType: item.mimeType,
                    location: item.latitude && item.longitude ? { lat: item.latitude, lng: item.longitude } : undefined,
                },
            });
        }
        return timelineEvents;
    }
    /**
     * Sort events chronologically
     */
    sortEvents(events) {
        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    /**
     * Group events into temporal clusters
     * Logic: Events within 'gapThreshold' hours of each other belong to the same cluster
     */
    generateClusters(events) {
        if (events.length === 0)
            return [];
        const clusters = [];
        const GAP_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
        const MIN_EVENTS_PER_CLUSTER = 3;
        let currentClusterEvents = [events[0]];
        for (let i = 1; i < events.length; i++) {
            const prevEvent = events[i - 1];
            const currentEvent = events[i];
            const timeDiff = currentEvent.timestamp.getTime() - prevEvent.timestamp.getTime();
            if (timeDiff <= GAP_THRESHOLD_MS) {
                currentClusterEvents.push(currentEvent);
            }
            else {
                // Close current cluster
                if (currentClusterEvents.length >= MIN_EVENTS_PER_CLUSTER) {
                    clusters.push(this.createClusterObject(currentClusterEvents));
                }
                // Start new cluster
                currentClusterEvents = [currentEvent];
            }
        }
        // Add final cluster
        if (currentClusterEvents.length >= MIN_EVENTS_PER_CLUSTER) {
            clusters.push(this.createClusterObject(currentClusterEvents));
        }
        return clusters;
    }
    createClusterObject(events) {
        return {
            id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            startDate: events[0].timestamp,
            endDate: events[events.length - 1].timestamp,
            events,
            significance: events.length, // Simple significance metric for now
        };
    }
    /**
     * Detect significant gaps in the timeline
     */
    detectGaps(events) {
        if (events.length < 2)
            return [];
        const gaps = [];
        const SIGNIFICANT_GAP_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
        for (let i = 1; i < events.length; i++) {
            const prevEvent = events[i - 1];
            const currentEvent = events[i];
            const timeDiff = currentEvent.timestamp.getTime() - prevEvent.timestamp.getTime();
            if (timeDiff >= SIGNIFICANT_GAP_MS) {
                gaps.push({
                    startDate: prevEvent.timestamp,
                    endDate: currentEvent.timestamp,
                    durationDays: Math.floor(timeDiff / (24 * 60 * 60 * 1000)),
                });
            }
        }
        return gaps;
    }
    /**
     * Enrich timeline with AI categorization
     */
    async enrichTimeline(timeline) {
        logger_1.logger.info(`Enriching timeline for user ${timeline.userId} with AI categorization`);
        // Categorize all events in batches
        const categorizationResults = await categorization_service_1.categorizationService.categorizeBatch(timeline.events);
        // Apply results to events
        timeline.events.forEach(event => {
            const result = categorizationResults.get(event.id);
            if (result) {
                event.category = result.category;
                event.tags = result.tags;
                event.metadata = {
                    ...event.metadata,
                    aiConfidence: result.confidence,
                    aiReasoning: result.reasoning
                };
            }
        });
        logger_1.logger.info(`Enriched ${timeline.events.length} events`);
        return timeline;
    }
}
exports.TimelineService = TimelineService;
exports.timelineService = new TimelineService();
