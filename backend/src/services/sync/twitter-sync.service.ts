import { TwitterApi, TweetV2, UserV2 } from 'twitter-api-v2';
import prisma from '../../db/prisma';

interface SyncResult {
    success: boolean;
    itemsFetched: number;
    itemsProcessed: number;
    errors: string[];
}

export class TwitterSyncService {
    private static readonly MAX_RESULTS = 100;
    private static readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

    /**
     * Sync all data from a Twitter data source
     */
    static async syncDataSource(dataSourceId: string): Promise<SyncResult> {
        const result: SyncResult = {
            success: false,
            itemsFetched: 0,
            itemsProcessed: 0,
            errors: [],
        };

        try {
            // Get data source
            const dataSource = await prisma.dataSource.findUnique({
                where: { id: dataSourceId },
            });

            if (!dataSource || dataSource.provider !== 'TWITTER') {
                throw new Error('Invalid Twitter data source');
            }

            if (!dataSource.accessToken) {
                throw new Error('No access token available');
            }

            // Update status
            await prisma.dataSource.update({
                where: { id: dataSourceId },
                data: { syncStatus: 'IN_PROGRESS' },
            });

            // Fetch tweets
            const tweetCount = await this.fetchUserTweets(dataSourceId, dataSource.accessToken);
            result.itemsFetched = tweetCount;
            result.itemsProcessed = tweetCount;

            // Update data source
            await prisma.dataSource.update({
                where: { id: dataSourceId },
                data: {
                    syncStatus: 'COMPLETED',
                    lastSyncAt: new Date(),
                    itemCount: { increment: tweetCount },
                },
            });

            result.success = true;
        } catch (error: any) {
            result.errors.push(error.message);

            await prisma.dataSource.update({
                where: { id: dataSourceId },
                data: {
                    syncStatus: 'FAILED',
                    lastSyncError: error.message,
                },
            });
        }

        return result;
    }

    /**
     * Fetch user tweets from Twitter API v2
     */
    static async fetchUserTweets(dataSourceId: string, accessToken: string): Promise<number> {
        const client = new TwitterApi(accessToken);
        let totalFetched = 0;

        try {
            // Get authenticated user
            const { data: user } = await client.v2.me();

            // Fetch tweets with pagination
            const tweets = await client.v2.userTimeline(user.id, {
                max_results: this.MAX_RESULTS,
                'tweet.fields': ['created_at', 'geo', 'entities', 'public_metrics'],
                expansions: ['geo.place_id'],
            });

            for await (const tweet of tweets) {
                await this.saveTweet(dataSourceId, tweet);
                totalFetched++;

                // Rate limiting: wait 100ms between processing
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error: any) {
            if (error.code === 429) {
                // Rate limit exceeded
                throw new Error('Twitter rate limit exceeded. Please try again in 15 minutes.');
            }
            throw error;
        }

        return totalFetched;
    }

    /**
     * Save tweet as SocialPost
     */
    private static async saveTweet(dataSourceId: string, tweet: TweetV2): Promise<void> {
        // Check if already exists
        const existing = await prisma.socialPost.findFirst({
            where: {
                dataSourceId,
                externalId: tweet.id,
            },
        });

        if (existing) {
            return; // Skip duplicates
        }

        // Extract location if available
        let location: string | undefined;
        if (tweet.geo && 'place_id' in tweet.geo) {
            // Note: Place details would be in includes.places if expanded
            location = tweet.geo.place_id;
        }

        // Create social post
        await prisma.socialPost.create({
            data: {
                dataSourceId,
                externalId: tweet.id,
                provider: 'TWITTER',
                content: tweet.text,
                url: `https://twitter.com/user/status/${tweet.id}`,
                createdAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
                metadata: {
                    publicMetrics: tweet.public_metrics,
                    entities: tweet.entities,
                    geo: tweet.geo,
                },
            },
        });
    }

    /**
     * Fetch tweets with specific criteria
     */
    static async fetchTweetsWithMedia(
        dataSourceId: string,
        accessToken: string
    ): Promise<number> {
        const client = new TwitterApi(accessToken);
        let totalFetched = 0;

        try {
            const { data: user } = await client.v2.me();

            const tweets = await client.v2.userTimeline(user.id, {
                max_results: this.MAX_RESULTS,
                'tweet.fields': ['created_at', 'attachments'],
                'media.fields': ['url', 'preview_image_url', 'type'],
                expansions: ['attachments.media_keys'],
            });

            for await (const tweet of tweets) {
                if (tweet.attachments?.media_keys) {
                    await this.saveTweet(dataSourceId, tweet);
                    totalFetched++;
                }

                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error: any) {
            if (error.code === 429) {
                throw new Error('Twitter rate limit exceeded');
            }
            throw error;
        }

        return totalFetched;
    }
}
