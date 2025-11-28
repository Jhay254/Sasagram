import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as collaborationController from '../controllers/collaboration.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Invitations
router.post('/invite', collaborationController.sendInvitation);
router.get('/invites', collaborationController.getInvitations);
router.post('/:id/accept', collaborationController.acceptInvitation);
router.post('/:id/decline', collaborationController.declineInvitation);
router.post('/:id/cancel', collaborationController.cancelInvitation);

// Suggestions
router.get('/suggestions', collaborationController.getSuggestions);
router.post('/suggestions/:id/dismiss', collaborationController.dismissSuggestion);

export default router;
