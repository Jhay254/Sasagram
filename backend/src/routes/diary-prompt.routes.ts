import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as diaryController from '../controllers/diary-prompt.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create entry
router.post('/entries', diaryController.createDiaryEntry);

// Get entries
router.get('/entries', diaryController.getDiaryEntries);

// Settings
router.get('/settings', diaryController.getPromptSettings);
router.put('/settings', diaryController.updatePromptSettings);

// Get random prompt
router.get('/prompt', diaryController.getRandomPrompt);

// Sync offline entries
router.post('/sync', diaryController.syncOfflineEntries);

export default router;
