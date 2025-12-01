"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.morganStream = exports.logAICost = exports.logAIError = exports.logAIOperation = exports.httpLogger = exports.aiLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Winston Logger Configuration
 * Provides structured logging with daily rotation and multiple transports
 */
// Ensure logs directory exists
const logDir = process.env.LOG_DIR || './logs';
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
// Tell winston about our colors
winston_1.default.addColors(colors);
// Custom format for console output
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
}));
// Custom format for file output
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Daily rotate file transport for all logs
const allLogsTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: fileFormat,
});
// Daily rotate file transport for error logs only
const errorLogsTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d', // Keep error logs for 30 days
    level: 'error',
    format: fileFormat,
});
// Daily rotate file transport for AI-specific logs
const aiLogsTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'ai-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
});
// Create the logger
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    levels,
    transports: [
        // Console transport (only in development)
        ...(process.env.NODE_ENV !== 'production'
            ? [
                new winston_1.default.transports.Console({
                    format: consoleFormat,
                }),
            ]
            : []),
        // File transports
        allLogsTransport,
        errorLogsTransport,
    ],
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'exceptions.log'),
            format: fileFormat,
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'rejections.log'),
            format: fileFormat,
        }),
    ],
});
/**
 * AI-specific logger for tracking AI operations
 */
exports.aiLogger = winston_1.default.createLogger({
    level: 'info',
    levels,
    transports: [
        aiLogsTransport,
        ...(process.env.NODE_ENV !== 'production'
            ? [
                new winston_1.default.transports.Console({
                    format: consoleFormat,
                }),
            ]
            : []),
    ],
    format: fileFormat,
});
/**
 * HTTP request logger middleware
 */
exports.httpLogger = winston_1.default.createLogger({
    level: 'http',
    levels,
    transports: [
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logDir, 'http-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '7d',
            format: fileFormat,
        }),
    ],
});
/**
 * Helper functions for structured logging
 */
const logAIOperation = (operation, data) => {
    exports.aiLogger.info(operation, {
        timestamp: new Date().toISOString(),
        operation,
        ...data,
    });
};
exports.logAIOperation = logAIOperation;
const logAIError = (operation, error, data) => {
    exports.aiLogger.error(operation, {
        timestamp: new Date().toISOString(),
        operation,
        error: error.message || error,
        stack: error.stack,
        ...data,
    });
};
exports.logAIError = logAIError;
const logAICost = (operation, tokens, cost, model) => {
    exports.aiLogger.info('AI Cost', {
        timestamp: new Date().toISOString(),
        operation,
        tokens,
        cost,
        model,
    });
};
exports.logAICost = logAICost;
/**
 * Stream for Morgan HTTP logger
 */
exports.morganStream = {
    write: (message) => {
        exports.httpLogger.http(message.trim());
    },
};
// Default export for backward compatibility
exports.default = exports.logger;
