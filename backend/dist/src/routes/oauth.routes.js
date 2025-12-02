"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oauth_controller_1 = require("../controllers/oauth.controller");
// import { validate } from '../middleware/validation.middleware';
// import { oauthCallbackSchema, twitterCallbackSchema } from '../schemas/oauth.schema';
const router = (0, express_1.Router)();
const oauthController = new oauth_controller_1.OAuthController();
// Instagram routes
router.get('/instagram', (req, res) => oauthController.instagramAuth(req, res));
router.get('/instagram/callback', /* validate(oauthCallbackSchema, 'query'), */ (req, res) => oauthController.instagramCallback(req, res));
// Twitter routes
router.get('/twitter', (req, res) => oauthController.twitterAuth(req, res));
router.get('/twitter/callback', /* validate(twitterCallbackSchema, 'query'), */ (req, res) => oauthController.twitterCallback(req, res));
// Facebook routes
router.get('/facebook', (req, res) => oauthController.facebookAuth(req, res));
router.get('/facebook/callback', /* validate(oauthCallbackSchema, 'query'), */ (req, res) => oauthController.facebookCallback(req, res));
// LinkedIn routes
router.get('/linkedin', (req, res) => oauthController.linkedinAuth(req, res));
router.get('/linkedin/callback', /* validate(oauthCallbackSchema, 'query'), */ (req, res) => oauthController.linkedinCallback(req, res));
// Gmail routes
router.get('/gmail', (req, res) => oauthController.gmailAuth(req, res));
router.get('/gmail/callback', /* validate(oauthCallbackSchema, 'query'), */ (req, res) => oauthController.gmailCallback(req, res));
// Outlook routes
router.get('/outlook', (req, res) => oauthController.outlookAuth(req, res));
router.get('/outlook/callback', /* validate(oauthCallbackSchema, 'query'), */ (req, res) => oauthController.outlookCallback(req, res));
exports.default = router;
