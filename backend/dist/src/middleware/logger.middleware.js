"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request
    logger_1.default.http(`${req.method} ${req.url}`);
    // Log response on finish
    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.url} ${res.statusCode} ${duration}ms`;
        if (res.statusCode >= 400) {
            logger_1.default.error(message);
        }
        else {
            logger_1.default.http(message);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
