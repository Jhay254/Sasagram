import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ndaController from '../controllers/nda.controller';

const router = Router();

// Public route to get NDA text
router.get('/current', ndaController.getCurrentNDA);

// Protected routes
router.use(authenticate);

router.post('/sign', ndaController.signNDA);
router.get('/status', ndaController.getNDAStatus);

export default router;
