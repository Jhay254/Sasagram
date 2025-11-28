import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

/**
 * Search biographies with filters
 */
export async function searchBiographies(req: Request, res: Response) {
    try {
        const { q, genre, tags, minViews, verified, limit = 20, offset = 0 } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ success: false, message: 'Search query required' });
        }

        const filters = {
            genre: genre as string | undefined,
            tags: tags ? (typeof tags === 'string' ? [tags] : tags as string[]) : undefined,
            minViews: minViews ? Number(minViews) : undefined,
            verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
        };

        const results = await SearchService.searchBiographies(
            q,
            filters,
            Number(limit),
            Number(offset)
        );

        // Save to search history if authenticated
        if (req.user?.id) {
            await SearchService.saveSearchHistory(req.user.id, q);
        }

        res.json({
            success: true,
            data: results,
        });
    } catch (error: any) {
        console.error('Error searching biographies:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Search creators
 */
export async function searchCreators(req: Request, res: Response) {
    try {
        const { q, verified, limit = 20, offset = 0 } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ success: false, message: 'Search query required' });
        }

        const results = await SearchService.searchCreators(
            q,
            verified === 'true' ? true : verified === 'false' ? false : undefined,
            Number(limit),
            Number(offset)
        );

        res.json({
            success: true,
            data: results,
        });
    } catch (error: any) {
        console.error('Error searching creators:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get autocomplete suggestions
 */
export async function getAutocomplete(req: Request, res: Response) {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || typeof q !== 'string') {
            return res.json({ success: true, data: { biographies: [], creators: [], tags: [] } });
        }

        const suggestions = await SearchService.getAutocompleteSuggestions(q, Number(limit));

        res.json({
            success: true,
            data: suggestions,
        });
    } catch (error: any) {
        console.error('Error getting autocomplete:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Search tags
 */
export async function searchTags(req: Request, res: Response) {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ success: false, message: 'Search query required' });
        }

        const tags = await SearchService.searchTags(q, Number(limit));

        res.json({
            success: true,
            data: tags,
        });
    } catch (error: any) {
        console.error('Error searching tags:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get trending tags
 */
export async function getTrendingTags(req: Request, res: Response) {
    try {
        const { limit = 20 } = req.query;

        const tags = await SearchService.getTrendingTags(Number(limit));

        res.json({
            success: true,
            data: tags,
        });
    } catch (error: any) {
        console.error('Error getting trending tags:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get search history
 */
export async function getSearchHistory(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { limit = 10 } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const history = await SearchService.getSearchHistory(userId, Number(limit));

        res.json({
            success: true,
            data: history,
        });
    } catch (error: any) {
        console.error('Error getting search history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Clear search history
 */
export async function clearSearchHistory(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await SearchService.clearSearchHistory(userId);

        res.json({
            success: true,
            message: 'Search history cleared',
        });
    } catch (error: any) {
        console.error('Error clearing search history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Delete search history item
 */
export async function deleteSearchHistoryItem(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { historyId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await SearchService.deleteSearchHistoryItem(userId, historyId);

        res.json({
            success: true,
            message: 'History item deleted',
        });
    } catch (error: any) {
        console.error('Error deleting history item:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
