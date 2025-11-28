import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as vaultController from '../controllers/vault.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Vault content management
router.post('/create', vaultController.createVaultContent);
router.get('/', vaultController.getUserVaultContent);
router.post('/:id/access', vaultController.accessVaultContent);
router.post('/verify-token', vaultController.verifyAccessToken);
router.delete('/:id', vaultController.deleteVaultContent);

export default router;
