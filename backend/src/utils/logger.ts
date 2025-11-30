import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

/**
 * Winston Logger Configuration
 * Provides structured logging with daily rotation and multiple transports
 */

// Ensure logs directory exists
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
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
winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

// Custom format for file output
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Daily rotate file transport for all logs
const allLogsTransport = new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: fileFormat,
});

// Daily rotate file transport for error logs only
const errorLogsTransport = new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d', // Keep error logs for 30 days
    level: 'error',
    format: fileFormat,
});

// Daily rotate file transport for AI-specific logs
const aiLogsTransport = new DailyRotateFile({
    filename: path.join(logDir, 'ai-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
});

// Create the logger
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    levels,
    transports: [
        // Console transport (only in development)
        ...(process.env.NODE_ENV !== 'production'
            ? [
                new winston.transports.Console({
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
        new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log'),
            format: fileFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'rejections.log'),
            format: fileFormat,
        }),
    ],
});

/**
 * AI-specific logger for tracking AI operations
 */
export const aiLogger = winston.createLogger({
    level: 'info',
    levels,
    transports: [
        aiLogsTransport,
        ...(process.env.NODE_ENV !== 'production'
            ? [
                new winston.transports.Console({
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
export const httpLogger = winston.createLogger({
    level: 'http',
    levels,
    transports: [
        new DailyRotateFile({
            filename: path.join(logDir, 'http-%DATE%.log'),
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
export const logAIOperation = (operation: string, data: any) => {
    aiLogger.info(operation, {
        timestamp: new Date().toISOString(),
        operation,
        ...data,
    });
};

export const logAIError = (operation: string, error: any, data?: any) => {
    aiLogger.error(operation, {
        timestamp: new Date().toISOString(),
        operation,
        error: error.message || error,
        stack: error.stack,
        ...data,
    });
};

export const logAICost = (operation: string, tokens: number, cost: number, model: string) => {
    aiLogger.info('AI Cost', {
        timestamp: new Date().toISOString(),
        operation,
        tokens,
        cost,
        model,
    });
};

/**
 * Stream for Morgan HTTP logger
 */
export const morganStream = {
    write: (message: string) => {
        httpLogger.http(message.trim());
    },
};

// Default export for backward compatibility
export default logger;
