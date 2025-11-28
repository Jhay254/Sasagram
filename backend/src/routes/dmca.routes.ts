import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as dmcaController from '../controllers/dmca.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// DMCA takedown requests
router.post('/takedown', dmcaController.submitTakedownRequest);
router.get('/requests', dmcaController.getUserTakedownRequests);
router.get('/:id/status', dmcaController.getTakedownStatus);
router.post('/:id/counter-notice', dmcaController.submitCounterNotice);

export default router;
