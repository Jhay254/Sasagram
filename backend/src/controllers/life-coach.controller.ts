import { Request, Response } from 'express';
import { LifeCoachService } from '../services/life-coach.service';

/**
 * Ask life coach a question
 * POST /api/life-coach/query
 */
export const askQuestion = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { query, conversationId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const result = await LifeCoachService.processQuery(userId, query, conversationId);

        res.json({
            success: true,
            query: result,
        });
    } catch (error: any) {
        console.error('Error processing life coach query:', error);

        if (error.message.includes('must be enabled')) {
            return res.status(403).json({ error: error.message });
        }

        res.status(500).json({ error: error.message || 'Failed to process query' });
    }
};

/**
 * Get conversation history
 * GET /api/life-coach/conversations
 */
export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const conversations = await LifeCoachService.getConversations(userId);

        res.json({
            count: conversations.length,
            conversations,
        });
    } catch (error: any) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: error.message || 'Failed to get conversations' });
    }
};

/**
 * Get specific conversation
 * GET /api/life-coach/conversations/:id
 */
export const getConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id: conversationId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const queries = await LifeCoachService.getConversation(userId, conversationId);

        res.json({
            conversationId,
            messageCount: queries.length,
            queries,
        });
    } catch (error: any) {
        console.error('Error getting conversation:', error);
        res.status(500).json({ error: error.message || 'Failed to get conversation' });
    }
};

/**
 * Get proactive coaching suggestions
 * GET /api/life-coach/suggestions
 */
export const getSuggestions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const suggestions = await LifeCoachService.generateProactiveSuggestions(userId);

        res.json({
            suggestions,
        });
    } catch (error: any) {
        console.error('Error getting suggestions:', error);
        res.status(500).json({ error: error.message || 'Failed to get suggestions' });
    }
};

/**
 * Rate a life coach response
 * POST /api/life-coach/rate
 */
export const rateResponse = async (req: Request, res: Response) => {
    try {
        const { queryId, rating, feedback, wasHelpful } = req.body;

        if (!queryId || !rating) {
            return res.status(400).json({ error: 'queryId and rating are required' });
        }

        await LifeCoachService.rateResponse(queryId, rating, feedback, wasHelpful);

        res.json({
            success: true,
            message: 'Rating recorded',
        });
    } catch (error: any) {
        console.error('Error rating response:', error);
        res.status(500).json({ error: error.message || 'Failed to rate response' });
    }
};

/**
 * Delete a conversation
 * DELETE /api/life-coach/conversations/:id
 */
export const deleteConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id: conversationId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await LifeCoachService.deleteConversation(userId, conversationId);

        res.json({
            success: true,
            message: 'Conversation deleted',
        });
    } catch (error: any) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: error.message || 'Failed to delete conversation' });
    }
};
