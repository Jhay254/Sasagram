import { Request, Response } from 'express';
import { PatternDetectionService } from '../services/pattern-detection.service';
import { PatternType } from '@prisma/client';

/**
 * Get user's detected patterns
 * GET /api/patterns
 */
export const getPatterns = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const typeFilter = req.query.type as PatternType | undefined;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const patterns = await PatternDetectionService.getUserPatterns(userId, typeFilter);

        res.json({
            count: patterns.length,
            patterns,
        });
    } catch (error: any) {
        console.error('Error getting patterns:', error);
        res.status(500).json({ error: error.message || 'Failed to get patterns' });
    }
};

/**
 * Get specific pattern details
 * GET /api/patterns/:id
 */
export const getPatternById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        const pattern = await PatternDetectionService.getUserPatterns(userId);
        const found = pattern.find(p => p.id === id);

        if (!found) {
            return res.status(404).json({ error: 'Pattern not found' });
        }

        res.json(found);
    } catch (error: any) {
        console.error('Error getting pattern:', error);
        res.status(500).json({ error: error.message || 'Failed to get pattern' });
    }
};

/**
 * Trigger pattern detection analysis
 * POST /api/patterns/analyze
 */
export const analyzePatterns = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Trigger pattern detection
        const patterns = await PatternDetectionService.detectAllPatterns(userId);

        res.json({
            success: true,
            message: `Detected ${patterns.length} patterns`,
            patterns,
        });
    } catch (error: any) {
        console.error('Error analyzing patterns:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze patterns' });
    }
};

/**
 * Provide feedback on a pattern
 * PUT /api/patterns/:id/feedback
 */
export const providePatternFeedback = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;
        const { feedback, notes } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!['HELPFUL', 'NOT_HELPFUL', 'INACCURATE'].includes(feedback)) {
            return res.status(400).json({ error: 'Invalid feedback value' });
        }

        await PatternDetectionService.provideFeedback(id, userId, feedback, notes);

        res.json({
            success: true,
            message: 'Feedback recorded',
        });
    } catch (error: any) {
        console.error('Error providing feedback:', error);
        res.status(500).json({ error: error.message || 'Failed to provide feedback' });
    }
};

/**
 * Delete/hide a pattern
 * DELETE /api/patterns/:id
 */
export const deletePattern = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await PatternDetectionService.deletePattern(id, userId);

        res.json({
            success: true,
            message: 'Pattern deleted',
        });
    } catch (error: any) {
        console.error('Error deleting pattern:', error);
        res.status(500).json({ error: error.message || 'Failed to delete pattern' });
    }
};
