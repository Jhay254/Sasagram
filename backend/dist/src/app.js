"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const logger_middleware_1 = require("./middleware/logger.middleware");
const rate_limit_middleware_1 = require("./middleware/rate-limit.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const oauth_routes_1 = __importDefault(require("./routes/oauth.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const network_routes_1 = __importDefault(require("./routes/network.routes"));
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// Compression middleware (gzip)
app.use((0, compression_1.default)({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    },
    level: 6, // Compression level (0-9)
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
}));
// Request logging
app.use(logger_middleware_1.requestLogger);
// Body parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Lifeline API Documentation',
}));
// Apply global rate limiter to all requests
app.use(rate_limit_middleware_1.globalLimiter);
// Routes
app.use('/auth', rate_limit_middleware_1.authLimiter, auth_routes_1.default);
app.use('/auth', rate_limit_middleware_1.oauthLimiter, oauth_routes_1.default);
app.use('/media', rate_limit_middleware_1.mediaLimiter, media_routes_1.default);
app.use('/api/network', network_routes_1.default); // Phase 2.1: Network Effects
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Global Error Handler
app.use((err, req, res, next) => {
    logger_1.default.error(err.stack || err.message);
    res.status(500).json({ error: 'Something went wrong!' });
});
exports.default = app;
