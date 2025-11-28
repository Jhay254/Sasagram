import axios from 'axios';
import prisma from '../../db/prisma';

interface InstagramMediaResponse {
    data: Array<{
        id: string;
        caption?: string;
        media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
        media_url: string;
        permalink: string;
        timestamp: string;
        location?: {
            name: string;
            latitude?: number;
            longitude?: number;
        };
    }>;
    paging?: {
        cursors: {
            before: string;
            after: string;
        };
        next?: string;
    };
}

interface SyncResult {
    success: boolean;
    itemsFetched: number;
    itemsProcessed: number;
    errors: string[];
}

export class InstagramSyncService {
    private static readonly BASE_URL = 'https://graph.instagram.com';
    private static readonly BATCH_SIZE = 100;

    /**
     * Sync all data from an Instagram data source
     */
    static async syncDataSource(dataSourceId: string): Promise<SyncResult> {
        const result: SyncResult = {
            success: false,
            itemsFetched: 0,
            itemsProcessed: 0,
            errors: [],
        };

        try {
            // Get data source with decrypted token
            const dataSource = await prisma.dataSource.findUnique({
                where: { id: dataSourceId },
            });

            if (!dataSource || dataSource.provider !== 'INSTAGRAM') {
                throw new Error('Invalid Instagram data source');
            }

            if (!dataSource.accessToken) {
                throw new Error('No access token available');
            }

            // Update status
            await prisma.dataSource.update({
                where: { id: dataSourceId },
                data: { syncStatus: 'IN_PROGRESS' },
            });

            // Fetch posts
            const postCount = await this.fetchUserPosts(dataSourceId, dataSource.accessToken);
            result.itemsFetched = postCount;
            result.itemsProcessed = postCount;

            // Update data source
            await prisma.dataSource.update({
                where: { id: dataSourceId },
                data: {
                    syncStatus: 'COMPLETED',
                    lastSyncAt: new Date(),
                    itemCount: { increment: postCount },
                },
            });

            result.success = true;
        } catch (error: any) {
            result.errors.push(error.message);

            // Update data source with error
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
     * Fetch user posts from Instagram Graph API
     */
    static async fetchUserPosts(dataSourceId: string, accessToken: string): Promise<number> {
        let totalFetched = 0;
        let nextUrl: string | undefined = `${this.BASE_URL}/me/media`;

        while (nextUrl) {
            try {
                const response = await axios.get<InstagramMediaResponse>(nextUrl, {
                    params: {
                        fields: 'id,caption,media_type,media_url,permalink,timestamp',
                        access_token: accessToken,
                        limit: this.BATCH_SIZE,
                    },
                });

                const { data, paging } = response.data;

                // Process each media item
                for (const media of data) {
                    await this.savePost(dataSourceId, media);
                    await this.saveMediaItem(dataSourceId, media);
                    totalFetched++;
                }

                // Check for next page
                nextUrl = paging?.next;

                // Respect rate limits (wait 100ms between requests)
                if (nextUrl) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error: any) {
                if (error.response?.status === 429) {
                    // Rate limit hit, wait and retry
                    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
                    continue;
                }
                throw error;
            }
        }

        return totalFetched;
    }

    /**
     * Save Instagram post as SocialPost
     */
    private static async savePost(
        dataSourceId: string,
        media: InstagramMediaResponse['data'][0]
    ): Promise<void> {
        // Check if already exists
        const existing = await prisma.socialPost.findFirst({
            where: {
                dataSourceId,
                externalId: media.id,
            },
        });

        if (existing) {
            return; // Skip duplicates
        }

        // Create social post
        await prisma.socialPost.create({
            data: {
                dataSourceId,
                externalId: media.id,
                provider: 'INSTAGRAM',
                content: media.caption || '',
                url: media.permalink,
                createdAt: new Date(media.timestamp),
                metadata: {
                    mediaType: media.media_type,
                },
            },
        });
    }

    /**
     * Save Instagram media item as MediaItem
     */
    private static async saveMediaItem(
        dataSourceId: string,
        media: InstagramMediaResponse['data'][0]
    ): Promise<void> {
        // Check if already exists
        const existing = await prisma.mediaItem.findFirst({
            where: {
                dataSourceId,
                externalId: media.id,
            },
        });

        if (existing) {
            return;
        }

        // Determine media type
        let mediaType: 'PHOTO' | 'VIDEO';
        if (media.media_type === 'VIDEO') {
            mediaType = 'VIDEO';
        } else {
            mediaType = 'PHOTO';
        }

        // Create media item
        await prisma.mediaItem.create({
            data: {
                dataSourceId,
                externalId: media.id,
                provider: 'INSTAGRAM',
                type: mediaType,
                url: media.media_url,
                createdAt: new Date(media.timestamp),
                metadata: {
                    caption: media.caption,
                    permalink: media.permalink,
                },
            },
        });
    }

    /**
     * Fetch media with location data
     */
    static async fetchMediaWithLocation(
        dataSourceId: string,
        accessToken: string
    ): Promise<number> {
        let totalFetched = 0;
        let nextUrl: string | undefined = `${this.BASE_URL}/me/media`;

        while (nextUrl) {
            try {
                const response = await axios.get<InstagramMediaResponse>(nextUrl, {
                    params: {
                        fields: 'id,caption,media_url,timestamp,location{name,latitude,longitude}',
                        access_token: accessToken,
                        limit: this.BATCH_SIZE,
                    },
                });

                const { data, paging } = response.data;

                for (const media of data) {
                    if (media.location) {
                        await this.saveMediaItemWithLocation(dataSourceId, media);
                        totalFetched++;
                    }
                }

                nextUrl = paging?.next;

                if (nextUrl) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error: any) {
                if (error.response?.status === 429) {
                    await new Promise(resolve => setTimeout(resolve, 60000));
                    continue;
                }
                throw error;
            }
        }

        return totalFetched;
    }

    /**
     * Save media item with location data
     */
    private static async saveMediaItemWithLocation(
        dataSourceId: string,
        media: InstagramMediaResponse['data'][0]
    ): Promise<void> {
        const existing = await prisma.mediaItem.findFirst({
            where: {
                dataSourceId,
                externalId: media.id,
            },
        });

        if (existing) {
            // Update with location data
            await prisma.mediaItem.update({
                where: { id: existing.id },
                data: {
                    location: media.location?.name,
                    latitude: media.location?.latitude,
                    longitude: media.location?.longitude,
                },
            });
        } else {
            // Create new
            await prisma.mediaItem.create({
                data: {
                    dataSourceId,
                    externalId: media.id,
                    provider: 'INSTAGRAM',
                    type: 'PHOTO',
                    url: media.media_url,
                    location: media.location?.name,
                    latitude: media.location?.latitude,
                    longitude: media.location?.longitude,
                    createdAt: new Date(media.timestamp),
                },
            });
        }
    }
}
