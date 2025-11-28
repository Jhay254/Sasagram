import { Request, Response } from 'express';
import { DiscoveryService } from '../services/discovery.service';
import { UserActivityService, ActivityType } from '../services/user-activity.service';

/**
 * Get personalized feed
 */
export async function getPersonalizedFeed(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { limit = 20, offset = 0 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const feed = await DiscoveryService.getPersonalizedFeed(
            userId,
            Number(limit),
            Number(offset)
        );

        res.json({
            success: true,
            data: feed,
        });
    } catch (error: any) {
        console.error('Error getting feed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get trending biographies
 */
export async function getTrending(req: Request, res: Response) {
    try {
        const { limit = 10 } = req.query;

        const trending = await DiscoveryService.getTrendingBiographies(Number(limit));

        res.json({
            success: true,
            data: trending,
        });
    } catch (error: any) {
        console.error('Error getting trending:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get biographies by category
 */
export async function getBiographiesByCategory(req: Request, res: Response) {
    try {
        const { category } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const biographies = await DiscoveryService.getBiographiesByCategory(
            category,
            Number(limit),
            Number(offset)
        );

        res.json({
            success: true,
            data: biographies,
        });
    } catch (error: any) {
        console.error('Error getting biographies by category:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get featured creators
 */
export async function getFeaturedCreators(req: Request, res: Response) {
    try {
        const { limit = 10 } = req.query;

        const creators = await DiscoveryService.getFeaturedCreators(Number(limit));

        res.json({
            success: true,
            data: creators,
        });
    } catch (error: any) {
        console.error('Error getting featured creators:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Search biographies
 */
export async function searchBiographies(req: Request, res: Response) {
    try {
        const { q } = req.query;
        const { limit = 20, offset = 0 } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ success: false, message: 'Search query required' });
        }

        const results = await DiscoveryService.searchBiographies(
            q,
            Number(limit),
            Number(offset)
        );

        // Track search activity
        if (req.user?.id) {
            await UserActivityService.trackActivity(
                req.user.id,
                ActivityType.SEARCH,
                undefined,
                { query: q }
            );
        }

        res.json({
            success: true,
            data: results,
        });
    } catch (error: any) {
        console.error('Error searching:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get categories
 */
export async function getCategories(req: Request, res: Response) {
    try {
        const categories = await DiscoveryService.getCategories();

        res.json({
            success: true,
            data: categories,
        });
    } catch (error: any) {
        console.error('Error getting categories:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Track activity
 */
export async function trackActivity(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { activityType, targetId, metadata } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await UserActivityService.trackActivity(userId, activityType, targetId, metadata);

        res.json({
            success: true,
            message: 'Activity tracked',
        });
    } catch (error: any) {
        console.error('Error tracking activity:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
