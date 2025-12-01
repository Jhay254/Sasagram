"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdSchema = exports.updateUserSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// User validation schemas
exports.updateUserSchema = joi_1.default.object({
    name: joi_1.default.string()
        .min(1)
        .max(100)
        .optional()
        .messages({
        'string.max': 'Name must not exceed 100 characters',
    }),
    email: joi_1.default.string()
        .email()
        .max(255)
        .optional()
        .messages({
        'string.email': 'Please provide a valid email address',
    }),
});
exports.userIdSchema = joi_1.default.object({
    userId: joi_1.default.string()
        .uuid()
        .required()
        .messages({
        'string.guid': 'Invalid user ID format',
        'any.required': 'User ID is required',
    }),
});
