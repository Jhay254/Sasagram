"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twitterCallbackSchema = exports.oauthCallbackSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// OAuth callback validation
exports.oauthCallbackSchema = joi_1.default.object({
    code: joi_1.default.string()
        .required()
        .max(1000)
        .messages({
        'any.required': 'Authorization code is required',
        'string.max': 'Invalid authorization code',
    }),
    state: joi_1.default.string()
        .optional()
        .max(500)
        .messages({
        'string.max': 'Invalid state parameter',
    }),
    error: joi_1.default.string()
        .optional()
        .messages({
        'string.base': 'Invalid error parameter',
    }),
    error_description: joi_1.default.string()
        .optional()
        .messages({
        'string.base': 'Invalid error description',
    }),
});
// Twitter OAuth callback (requires state for PKCE)
exports.twitterCallbackSchema = joi_1.default.object({
    code: joi_1.default.string()
        .required()
        .max(1000)
        .messages({
        'any.required': 'Authorization code is required',
    }),
    state: joi_1.default.string()
        .required()
        .max(500)
        .messages({
        'any.required': 'State parameter is required',
        'string.max': 'Invalid state parameter',
    }),
});
