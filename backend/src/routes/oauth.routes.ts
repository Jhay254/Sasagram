import { Router } from 'express';
import {
    initiateInstagramOAuth,
    handleInstagramCallback,
    initiateTwitterOAuth,
    handleTwitterCallback,
    initiateFacebookOAuth,
    handleFacebookCallback,
    initiateLinkedInOAuth,
    handleLinkedInCallback,
    initiateGoogleOAuth,
    handleGoogleCallback,
    initiateMicrosoftOAuth,
    handleMicrosoftCallback,
    getConnectedDataSources,
    disconnectDataSource,
} from '../controllers/oauth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Instagram OAuth
router.get('/instagram/initiate', authenticate, initiateInstagramOAuth);
router.get('/instagram/callback', handleInstagramCallback);

// Twitter OAuth
router.get('/twitter/initiate', authenticate, initiateTwitterOAuth);
router.get('/twitter/callback', handleTwitterCallback);

// Facebook OAuth
router.get('/facebook/initiate', authenticate, initiateFacebookOAuth);
router.get('/facebook/callback', handleFacebookCallback);

// LinkedIn OAuth
router.get('/linkedin/initiate', authenticate, initiateLinkedInOAuth);
router.get('/linkedin/callback', handleLinkedInCallback);

// Google OAuth (Gmail)
router.get('/google/initiate', authenticate, initiateGoogleOAuth);
router.get('/google/callback', handleGoogleCallback);

// Microsoft OAuth (Outlook)
router.get('/microsoft/initiate', authenticate, initiateMicrosoftOAuth);
router.get('/microsoft/callback', handleMicrosoftCallback);

// Data Sources Management
router.get('/data-sources', authenticate, getConnectedDataSources);
router.delete('/data-sources/:dataSourceId', authenticate, disconnectDataSource);

export default router;
