"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oauth_controller_1 = require("../controllers/oauth.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const oauth_schema_1 = require("../schemas/oauth.schema");
const router = (0, express_1.Router)();
const oauthController = new oauth_controller_1.OAuthController();
// Instagram routes
router.get('/instagram', (req, res) => oauthController.instagramAuth(req, res));
router.get('/instagram/callback', (0, validation_middleware_1.validate)(oauth_schema_1.oauthCallbackSchema, 'query'), (req, res) => oauthController.instagramCallback(req, res));
// Twitter routes
router.get('/twitter', (req, res) => oauthController.twitterAuth(req, res));
router.get('/twitter/callback', (0, validation_middleware_1.validate)(oauth_schema_1.twitterCallbackSchema, 'query'), (req, res) => oauthController.twitterCallback(req, res));
// Facebook routes
router.get('/facebook', (req, res) => oauthController.facebookAuth(req, res));
router.get('/facebook/callback', (0, validation_middleware_1.validate)(oauth_schema_1.oauthCallbackSchema, 'query'), (req, res) => oauthController.facebookCallback(req, res));
// LinkedIn routes
router.get('/linkedin', (req, res) => oauthController.linkedinAuth(req, res));
router.get('/linkedin/callback', (0, validation_middleware_1.validate)(oauth_schema_1.oauthCallbackSchema, 'query'), (req, res) => oauthController.linkedinCallback(req, res));
// Gmail routes
router.get('/gmail', (req, res) => oauthController.gmailAuth(req, res));
router.get('/gmail/callback', (0, validation_middleware_1.validate)(oauth_schema_1.oauthCallbackSchema, 'query'), (req, res) => oauthController.gmailCallback(req, res));
// Outlook routes
router.get('/outlook', (req, res) => oauthController.outlookAuth(req, res));
router.get('/outlook/callback', (0, validation_middleware_1.validate)(oauth_schema_1.oauthCallbackSchema, 'query'), (req, res) => oauthController.outlookCallback(req, res));
exports.default = router;
