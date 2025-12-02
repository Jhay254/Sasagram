import * as Joi from 'joi';

/**
 * Media Upload Schema
 */
export const mediaUploadSchema = Joi.object({
    file: Joi.any().required(),
    caption: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string()).max(20).optional(),
    isPrivate: Joi.boolean().optional(),
});

/**
 * Media Query Schema
 */
export const mediaQuerySchema = Joi.object({
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
export const mediaUpdateSchema = Joi.object({
    caption: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string()).max(20).optional(),
    isPrivate: Joi.boolean().optional(),
}).min(1); // At least one field must be provided

/**
 * Media Delete Schema
 */
export const mediaDeleteSchema = Joi.object({
    mediaIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

/**
 * Media Analysis Schema
 */
export const mediaAnalysisSchema = Joi.object({
    mediaId: Joi.string().uuid().required(),
    analysisType: Joi.string().valid('vision', 'ocr', 'sentiment', 'all').default('all'),
});
