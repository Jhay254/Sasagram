import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as searchController from '../controllers/search.controller';

const router = Router();

// Public routes
router.get('/biographies', searchController.searchBiographies);
router.get('/creators', searchController.searchCreators);
router.get('/autocomplete', searchController.getAutocomplete);
router.get('/tags', searchController.searchTags);
router.get('/tags/trending', searchController.getTrendingTags);

// Protected routes
router.use(authenticate);

router.get('/history', searchController.getSearchHistory);
router.delete('/history', searchController.clearSearchHistory);
router.delete('/history/:historyId', searchController.deleteSearchHistoryItem);

export default router;
