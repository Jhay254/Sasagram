import prisma from '../db/prisma';
import { AIService } from './ai.service';

interface UserDataPoint {
    type: 'social_post' | 'media_item' | 'email_event';
    timestamp: Date;
    content?: string;
    location?: string;
    category?: string;
    metadata?: any;
}

export class BiographyService {
    // Main biography generation flow
    static async generateBiography(userId: string): Promise<string> {
        // Update biography status to GENERATING
        let biography = await prisma.biography.findUnique({
            where: { userId },
        });

        if (!biography) {
            biography = await prisma.biography.create({
                data: {
                    userId,
                    status: 'GENERATING',
                },
            });
        } else {
            biography = await prisma.biography.update({
                where: { userId },
                data: { status: 'GENERATING' },
            });
        }

        try {
            // Step 1: Aggregate user data
            const userDataPoints = await this.aggregateUserData(userId);

            if (userDataPoints.length < 10) {
                throw new Error('Insufficient data points for biography generation. Please connect more data sources.');
            }

            // Step 2: Get user name
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true, displayName: true },
            });

            const userName = user?.displayName || `${user?.firstName} ${user?.lastName}` || 'User';

            // Step 3: Generate biography outline with AI
            const outline = await AIService.generateBiographyOutline(userDataPoints, userName);

            // Step 4: Update biography metadata
            await prisma.biography.update({
                where: { userId },
                data: {
                    title: outline.title,
                    description: outline.description,
                },
            });

            // Step 5: Create chapter records
            await this.createChapters(biography.id, outline.chapters, userDataPoints);

            // Step 6: Extract timeline events
            await this.extractTimelineEvents(biography.id, userDataPoints);

            // Step 7: Mark as completed
            await prisma.biography.update({
                where: { userId },
                data: {
                    status: 'DRAFT',
                    generatedAt: new Date(),
                },
            });

            return biography.id;
        } catch (error) {
            // Mark as failed, keep in DRAFT status
            await prisma.biography.update({
                where: { userId },
                data: { status: 'DRAFT' },
            });
            throw error;
        }
    }

    // Aggregate data from all connected sources
    static async aggregateUserData(userId: string): Promise<UserDataPoint[]> {
        const dataPoints: UserDataPoint[] = [];

        // Fetch social posts
        const socialPosts = await prisma.socialPost.findMany({
            where: {
                dataSource: {
                    userId,
                    status: 'CONNECTED',
                },
            },
            orderBy: { timestamp: 'desc' },
            take: 100, // Limit for performance
        });

        for (const post of socialPosts) {
            dataPoints.push({
                type: 'social_post',
                timestamp: post.timestamp,
                content: post.content || undefined,
                metadata: {
                    providerPostId: post.providerPostId,
                    likeCount: post.likeCount,
                    hashtags: post.hashtags,
                },
            });
        }

        // Fetch media items
        const mediaItems = await prisma.mediaItem.findMany({
            where: {
                dataSource: {
                    userId,
                    status: 'CONNECTED',
                },
            },
            orderBy: { timestamp: 'desc' },
            take: 100,
        });

        for (const media of mediaItems) {
            if (media.timestamp) {
                dataPoints.push({
                    type: 'media_item',
                    timestamp: media.timestamp,
                    content: media.caption || undefined,
                    location: media.location || undefined,
                    metadata: {
                        mediaType: media.mediaType,
                        url: media.storedUrl || media.originalUrl,
                    },
                });
            }
        }

        // Fetch email events
        const emailEvents = await prisma.emailMetadata.findMany({
            where: {
                dataSource: {
                    userId,
                    status: 'CONNECTED',
                },
                isEventEmail: true,
            },
            orderBy: { timestamp: 'desc' },
            take: 50,
        });

        for (const email of emailEvents) {
            dataPoints.push({
                type: 'email_event',
                timestamp: email.timestamp,
                content: `${email.eventType}: ${email.subject}`,
                location: email.eventLocation || undefined,
                category: email.eventType || undefined,
                metadata: {
                    eventDate: email.eventDate,
                },
            });
        }

        // Sort by timestamp
        return dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    // Create chapter records with AI-generated content
    static async createChapters(
        biographyId: string,
        chapterOutlines: any[],
        userDataPoints: UserDataPoint[]
    ): Promise<void> {
        for (let i = 0; i < chapterOutlines.length; i++) {
            const outline = chapterOutlines[i];

            // Filter data points relevant to this chapter
            const relevantData = this.filterDataForChapter(
                userDataPoints,
                outline.startDate,
                outline.endDate
            );

            // Generate chapter content with AI
            const previousChapter = i > 0 ? await this.getChapterContent(biographyId, i - 1) : undefined;
            const content = await AIService.generateChapterContent(
                outline.summary,
                relevantData,
                previousChapter
            );

            // Calculate metadata
            const wordCount = content.split(/\s+/).length;
            const readTime = Math.ceil(wordCount / 200); // Average reading speed

            // Create chapter
            await prisma.chapter.create({
                data: {
                    biographyId,
                    order: i,
                    title: outline.title,
                    content,
                    summary: outline.summary,
                    timeperiod: outline.timeperiod,
                    startDate: outline.startDate ? new Date(outline.startDate) : null,
                    endDate: outline.endDate ? new Date(outline.endDate) : null,
                    wordCount,
                    readTime,
                },
            });
        }
    }

    // Filter data points for a specific time period
    static filterDataForChapter(
        dataPoints: UserDataPoint[],
        startDate?: string,
        endDate?: string
    ): UserDataPoint[] {
        if (!startDate && !endDate) {
            return dataPoints;
        }

        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();

        return dataPoints.filter(
            (point) => point.timestamp >= start && point.timestamp <= end
        );
    }

    // Get chapter content for context
    static async getChapterContent(biographyId: string, order: number): Promise<string | undefined> {
        const chapter = await prisma.chapter.findFirst({
            where: { biographyId, order },
            select: { content: true },
        });

        return chapter?.content;
    }

    // Extract and save timeline events
    static async extractTimelineEvents(
        biographyId: string,
        userDataPoints: UserDataPoint[]
    ): Promise<void> {
        const events = await AIService.extractTimelineEvents(userDataPoints);

        for (const event of events) {
            await prisma.biographyEvent.create({
                data: {
                    biographyId,
                    date: new Date(event.date),
                    title: event.title,
                    description: event.description,
                    category: event.category,
                    location: event.location,
                },
            });
        }
    }

    // Regenerate a specific chapter
    static async regenerateChapter(chapterId: string): Promise<void> {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: { biography: true },
        });

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        // Get user data
        const userDataPoints = await this.aggregateUserData(chapter.biography.userId);

        // Filter for this chapter's time period
        const relevantData = this.filterDataForChapter(
            userDataPoints,
            chapter.startDate?.toISOString(),
            chapter.endDate?.toISOString()
        );

        // Get previous chapter for context
        const previousChapter =
            chapter.order > 0
                ? await this.getChapterContent(chapter.biographyId, chapter.order - 1)
                : undefined;

        // Regenerate content
        const newContent = await AIService.generateChapterContent(
            chapter.summary || chapter.title,
            relevantData,
            previousChapter
        );

        // Update chapter
        const wordCount = newContent.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200);

        await prisma.chapter.update({
            where: { id: chapterId },
            data: {
                content: newContent,
                wordCount,
                readTime,
                updatedAt: new Date(),
            },
        });
    }

    // Publish biography
    static async publishBiography(biographyId: string): Promise<void> {
        await prisma.biography.update({
            where: { id: biographyId },
            data: {
                status: 'PUBLISHED',
                isPublic: true,
                publishedAt: new Date(),
            },
        });
    }
}
