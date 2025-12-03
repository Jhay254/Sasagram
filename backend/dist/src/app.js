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
const tagging_routes_1 = __importDefault(require("./routes/tagging.routes"));
const merger_routes_1 = __importDefault(require("./routes/merger.routes"));
const engagement_routes_1 = __importDefault(require("./routes/engagement.routes"));
const rewind_routes_1 = __importDefault(require("./routes/rewind.routes"));
const gamification_routes_1 = __importDefault(require("./routes/gamification.routes"));
const referral_routes_1 = __importDefault(require("./routes/referral.routes"));
const invite_routes_1 = __importDefault(require("./routes/invite.routes"));
const living_routes_1 = __importDefault(require("./routes/living.routes"));
const viral_routes_1 = __importDefault(require("./routes/viral.routes"));
const protection_routes_1 = __importDefault(require("./routes/protection.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
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
// Audit logging for write operations
const audit_middleware_1 = require("./middleware/audit.middleware");
app.use(audit_middleware_1.auditMiddleware);
// Routes
app.use('/auth', rate_limit_middleware_1.authLimiter, auth_routes_1.default); // Phase 1: Authentication
app.use('/auth', rate_limit_middleware_1.oauthLimiter, oauth_routes_1.default);
app.use('/media', rate_limit_middleware_1.mediaLimiter, media_routes_1.default);
app.use('/api/network', network_routes_1.default); // Phase 2.1: Network Effects
app.use('/api/tags', tagging_routes_1.default); // Phase 2.1: Tagging System
app.use('/api/mergers', merger_routes_1.default); // Phase 2.1: Story Mergers
app.use('/api/engagement', engagement_routes_1.default); // Phase 2.2: Engagement & Retention
app.use('/api/rewind', rewind_routes_1.default); // Phase 2.2: Rewind Feature
app.use('/api/gamification', gamification_routes_1.default); // Phase 2.3: Gamification
app.use('/api/referral', referral_routes_1.default); // Phase 2.3: Referrals
app.use('/invite', invite_routes_1.default); // Phase 2.1: Viral Landing Pages (public)
app.use('/api/living', living_routes_1.default); // Phase 2.2: Living Chapters & AI
app.use('/api/viral', viral_routes_1.default); // Phase 2.4: Viral Growth
app.use('/api/protection', protection_routes_1.default); // Phase 2.6: Content Protection
app.use('/api/location', location_routes_1.default); // Phase 2.7: Location & Context
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 Handler - must be after all routes
app.use(error_middleware_1.notFoundHandler);
// Global Error Handler - must be last
app.use(error_middleware_1.errorHandler);
exports.default = app;
