import { Request, Response, NextFunction } from 'express';
import * as Joi from 'joi';
import Logger from '../utils/logger';

/**
 * Validation middleware factory
 * @param schema - Joi schema to validate against
 * @param property - Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema: Joi.Schema, property: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true, // Remove unknown properties
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            Logger.warn(`Validation failed for ${req.method} ${req.path}: ${JSON.stringify(errors)}`);

            return res.status(400).json({
                error: 'Validation failed',
                details: errors,
            });
        }

        // Replace request property with validated and sanitized value
        req[property] = value;
        next();
    };
};

/**
 * Sanitize string to prevent XSS
 */
export const sanitizeString = (str: string): string => {
    return str
        .replace(/[<>]/g, '') // Remove < and >
        .trim();
};

/**
 * Validate file upload
 */
export const validateFileUpload = (
    allowedTypes: string[],
    maxSize: number // in bytes
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!(req as any).file && !(req as any).files) {
            return next();
        }

        const file = (req as any).file || (Array.isArray((req as any).files) ? (req as any).files[0] : null);

        if (!file) {
            return next();
        }

        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
            Logger.warn(`Invalid file type uploaded: ${file.mimetype}`);
            return res.status(400).json({
                error: 'Invalid file type',
                allowed: allowedTypes,
            });
        }

        // Check file size
        if (file.size > maxSize) {
            Logger.warn(`File too large: ${file.size} bytes (max: ${maxSize})`);
            return res.status(400).json({
                error: 'File too large',
                maxSize: `${maxSize / 1024 / 1024}MB`,
            });
        }

        next();
    };
};
