import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as chapterSchedulingController from '../controllers/chapter-scheduling.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Chapter-specific scheduling
router.post('/:id/schedule', chapterSchedulingController.scheduleChapter);
router.get('/:id/schedule', chapterSchedulingController.getChapterSchedule);
router.delete('/:id/schedule', chapterSchedulingController.cancelChapterSchedule);
router.get('/:id/completion', chapterSchedulingController.checkChapterCompletion);

// Biography-wide scheduling
router.post('/biographies/:id/schedule', chapterSchedulingController.createBiographySchedule);
router.get('/biographies/:id/schedule', chapterSchedulingController.getBiographySchedule);
router.delete('/biographies/:id/schedule', chapterSchedulingController.deleteBiographySchedule);
router.get('/biographies/:id/upcoming', chapterSchedulingController.getUpcomingChapters);

// Manual job trigger (for testing)
router.post('/jobs/release-chapters', chapterSchedulingController.triggerReleaseJob);

export default router;
