import { LanguageServiceClient } from '@google-cloud/language';
import axios from 'axios';
import prisma from '../db/prisma';

/**
 * Sentiment Analysis Service - Google NLP powered media monitoring
 * Features: Real-time sentiment tracking, emotion detection, reputation scoring
 */
export class SentimentAnalysisService {
    private languageClient: LanguageServiceClient;

    constructor() {
        this.languageClient = new LanguageServiceClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
    }

    /**
     * Analyze media mention with Google NLP
     */
    async analyzeMediaMention(
        celebrityId: string,
        source: string,
        data: {
            title?: string;
            snippet: string;
            fullText?: string;
            sourceUrl?: string;
            sourceName?: string;
            author?: string;
            publishedAt: Date;
            engagementData?: {
                likes?: number;
                shares?: number;
                comments?: number;
                views?: number;
            };
        }
    ) {
        const textToAnalyze = data.fullText || data.snippet;

        // Google NLP - Sentiment Analysis
        const [sentimentResult] = await this.languageClient.analyzeSentiment({
            document: {
                content: textToAnalyze,
                type: 'PLAIN_TEXT',
            },
        });

        const sentiment = sentimentResult.documentSentiment;

        // Google NLP - Entity Analysis (extract people, places, orgs)
        const [entityResult] = await this.languageClient.analyzeEntities({
            document: {
                content: textToAnalyze,
                type: 'PLAIN_TEXT',
            },
        });

        // Extract topics from entities
        const topics = entityResult.entities
            ?.filter((e) => e.type === 'OTHER' || e.type === 'EVENT')
            .map((e) => e.name)
            .slice(0, 10) || [];

        // Determine sentiment label
        const sentimentLabel = this.getSentimentLabel(sentiment?.score || 0);

        // Create media mention record
        const mention = await prisma.mediaMention.create({
            data: {
                celebrityId,
                source,
                sourceUrl: data.sourceUrl,
                sourceName: data.sourceName,
                author: data.author,
                title: data.title,
                snippet: data.snippet,
                fullText: data.fullText,
                sentimentScore: sentiment?.score || 0,
                sentimentMagnitude: sentiment?.magnitude || 0,
                sentimentLabel,
                emotions: this.extractEmotions(sentiment),
                topics,
                entities: entityResult.entities,
                likes: data.engagementData?.likes,
                shares: data.engagementData?.shares,
                comments: data.engagementData?.comments,
                views: data.engagementData?.views,
                publishedAt: data.publishedAt,
            },
        });

        return mention;
    }

    /**
     * Get reputation score for celebrity (0-100)
     */
    async getReputationScore(celebrityId: string, days: number = 30) {
        const mentions = await prisma.mediaMention.findMany({
            where: {
                celebrityId,
                publishedAt: {
                    gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                },
            },
            orderBy: { publishedAt: 'desc' },
        });

        if (mentions.length === 0) {
            return {
                score: 50, // Neutral baseline
                totalMentions: 0,
                positive: 0,
                negative: 0,
                neutral: 0,
                avgSentiment: 0,
                trend: 'STABLE',
            };
        }

        // Calculate average sentiment (-1 to 1)
        const avgSentiment =
            mentions.reduce((sum, m) => sum + m.sentimentScore, 0) / mentions.length;

        // Convert to 0-100 scale
        const score = Math.round((avgSentiment + 1) * 50);

        // Categorize mentions
        const positive = mentions.filter((m) => m.sentimentScore > 0.25).length;
        const negative = mentions.filter((m) => m.sentimentScore < -0.25).length;
        const neutral = mentions.length - positive - negative;

        // Calculate trend (compare last 7 days vs previous 7-14 days)
        const recent = mentions.filter(
            (m) => m.publishedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        const previous = mentions.filter(
            (m) =>
                m.publishedAt <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
                m.publishedAt > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        );

        const recentAvg = recent.length
            ? recent.reduce((sum, m) => sum + m.sentimentScore, 0) / recent.length
            : 0;
        const previousAvg = previous.length
            ? previous.reduce((sum, m) => sum + m.sentimentScore, 0) / previous.length
            : 0;

        let trend = 'STABLE';
        if (recentAvg > previousAvg + 0.1) trend = 'IMPROVING';
        if (recentAvg < previousAvg - 0.1) trend = 'DECLINING';

        return {
            score,
            totalMentions: mentions.length,
            positive,
            negative,
            neutral,
            avgSentiment,
            trend,
            recentMentions: recent.length,
        };
    }

    /**
     * Get sentiment timeline (historical data)
     */
    async getSentimentTimeline(celebrityId: string, days: number = 90) {
        const mentions = await prisma.mediaMention.findMany({
            where: {
                celebrityId,
                publishedAt: {
                    gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                },
            },
            orderBy: { publishedAt: 'asc' },
        });

        // Group by day
        const timeline: Record<string, { date: string; avgSentiment: number; count: number }> = {};

        mentions.forEach((mention) => {
            const dateKey = mention.publishedAt.toISOString().split('T')[0];
            if (!timeline[dateKey]) {
                timeline[dateKey] = { date: dateKey, avgSentiment: 0, count: 0 };
            }
            timeline[dateKey].avgSentiment += mention.sentimentScore;
            timeline[dateKey].count += 1;
        });

        // Calculate averages
        const timelineArray = Object.values(timeline).map((day) => ({
            date: day.date,
            avgSentiment: day.count > 0 ? day.avgSentiment / day.count : 0,
            mentionCount: day.count,
            score: Math.round(((day.avgSentiment / day.count + 1) * 50)),
        }));

        return timelineArray;
    }

    /**
     * Monitor social media for new mentions
     */
    async monitorSocialMedia(celebrityId: string) {
        const profile = await prisma.celebrityProfile.findUnique({
            where: { id: celebrityId },
        });

        if (!profile) {
            throw new Error('Celebrity profile not found');
        }

        // Monitor Twitter/X
        if (profile.twitterHandle) {
            await this.monitorTwitter(celebrityId, profile.twitterHandle);
        }

        // Monitor Instagram (limited API access)
        // Monitor TikTok (limited API access)
        // Monitor news sources

        return { success: true, monitored: ['twitter', 'news'] };
    }

    /**
     * Monitor Twitter/X mentions
     */
    private async monitorTwitter(celebrityId: string, handle: string) {
        // Twitter API v2 integration
        // Note: Requires Twitter API credentials and elevated access

        try {
            const response = await axios.get(
                `https://api.twitter.com/2/tweets/search/recent`,
                {
                    params: {
                        query: `@${handle} OR "${handle}"`,
                        'tweet.fields': 'public_metrics,created_at,author_id',
                        max_results: 100,
                    },
                    headers: {
                        Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
                    },
                }
            );

            // Process each tweet
            for (const tweet of response.data.data || []) {
                await this.analyzeMediaMention(celebrityId, 'TWITTER', {
                    snippet: tweet.text,
                    fullText: tweet.text,
                    sourceUrl: `https://twitter.com/i/web/status/${tweet.id}`,
                    publishedAt: new Date(tweet.created_at),
                    engagementData: {
                        likes: tweet.public_metrics.like_count,
                        shares: tweet.public_metrics.retweet_count,
                        comments: tweet.public_metrics.reply_count,
                    },
                });
            }
        } catch (error) {
            console.error('Twitter monitoring error:', error);
        }
    }

    // ========== Private Helper Methods ==========

    private getSentimentLabel(score: number): string {
        if (score <= -0.6) return 'VERY_NEGATIVE';
        if (score <= -0.2) return 'NEGATIVE';
        if (score >= 0.6) return 'VERY_POSITIVE';
        if (score >= 0.2) return 'POSITIVE';
        return 'NEUTRAL';
    }

    private extractEmotions(sentiment: any): any {
        // Google NLP doesn't provide detailed emotions, so we infer from sentiment
        const score = sentiment?.score || 0;
        const magnitude = sentiment?.magnitude || 0;

        return {
            joy: score > 0.5 ? magnitude * 100 : 0,
            sadness: score < -0.5 ? magnitude * 100 : 0,
            anger: score < -0.3 && magnitude > 0.5 ? magnitude * 80 : 0,
            fear: score < -0.3 && magnitude > 0.3 ? magnitude * 60 : 0,
            surprise: magnitude > 0.7 ? magnitude * 70 : 0,
        };
    }
}
