"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaAnalysisSchema = exports.mediaDeleteSchema = exports.mediaUpdateSchema = exports.mediaQuerySchema = exports.mediaUploadSchema = void 0;
const Joi = __importStar(require("joi"));
/**
 * Media Upload Schema
 */
exports.mediaUploadSchema = Joi.object({
    file: Joi.any().required(),
    caption: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string()).max(20).optional(),
    isPrivate: Joi.boolean().optional(),
});
/**
 * Media Query Schema
 */
exports.mediaQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().valid('image', 'video', 'audio', 'document').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    search: Joi.string().max(100).optional(),
});
/**
 * Media Update Schema
 */
exports.mediaUpdateSchema = Joi.object({
    caption: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string()).max(20).optional(),
    isPrivate: Joi.boolean().optional(),
}).min(1); // At least one field must be provided
/**
 * Media Delete Schema
 */
exports.mediaDeleteSchema = Joi.object({
    mediaIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});
/**
 * Media Analysis Schema
 */
exports.mediaAnalysisSchema = Joi.object({
    mediaId: Joi.string().uuid().required(),
    analysisType: Joi.string().valid('vision', 'ocr', 'sentiment', 'all').default('all'),
});
