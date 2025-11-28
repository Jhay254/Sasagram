import { Router } from 'express';
import * as legalController from '../controllers/legal.controller';

const router = Router();

// Public legal documents (no auth required)
router.get('/tos', legalController.getTermsOfService);
router.get('/privacy', legalController.getPrivacyPolicy);
router.get('/dmca', legalController.getDMCAPolicy);
router.get('/all', legalController.getAllDocuments);
router.get('/:type/history', legalController.getDocumentHistory);

export default router;
