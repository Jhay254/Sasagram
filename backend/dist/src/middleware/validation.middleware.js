"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileUpload = exports.sanitizeString = exports.validate = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Validation middleware factory
 * @param schema - Joi schema to validate against
 * @param property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true, // Remove unknown properties
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            logger_1.default.warn(`Validation failed for ${req.method} ${req.path}: ${JSON.stringify(errors)}`);
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
exports.validate = validate;
/**
 * Sanitize string to prevent XSS
 */
const sanitizeString = (str) => {
    return str
        .replace(/[<>]/g, '') // Remove < and >
        .trim();
};
exports.sanitizeString = sanitizeString;
/**
 * Validate file upload
 */
const validateFileUpload = (allowedTypes, maxSize // in bytes
) => {
    return (req, res, next) => {
        if (!req.file && !req.files) {
            return next();
        }
        const file = req.file || (Array.isArray(req.files) ? req.files[0] : null);
        if (!file) {
            return next();
        }
        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
            logger_1.default.warn(`Invalid file type uploaded: ${file.mimetype}`);
            return res.status(400).json({
                error: 'Invalid file type',
                allowed: allowedTypes,
            });
        }
        // Check file size
        if (file.size > maxSize) {
            logger_1.default.warn(`File too large: ${file.size} bytes (max: ${maxSize})`);
            return res.status(400).json({
                error: 'File too large',
                maxSize: `${maxSize / 1024 / 1024}MB`,
            });
        }
        next();
    };
};
exports.validateFileUpload = validateFileUpload;
