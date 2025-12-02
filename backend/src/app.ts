import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { requestLogger } from './middleware/logger.middleware';
import { globalLimiter, authLimiter, oauthLimiter, mediaLimiter } from './middleware/rate-limit.middleware';
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import mediaRoutes from './routes/media.routes';
import networkRoutes from './routes/network.routes';
import taggingRoutes from './routes/tagging.routes';
import mergerRoutes from './routes/merger.routes';
import engagementRoutes from './routes/engagement.routes';
import rewindRoutes from './routes/rewind.routes';
import gamificationRoutes from './routes/gamification.routes';
import referralRoutes from './routes/referral.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import Logger from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());

// Compression middleware (gzip)
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6, // Compression level (0-9)
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
}));

// Request logging
app.use(requestLogger);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Lifeline API Documentation',
}));

// Apply global rate limiter to all requests
app.use(globalLimiter);

// Routes
app.use('/auth', authLimiter, authRoutes); // Phase 1: Authentication
app.use('/auth', oauthLimiter, oauthRoutes);
app.use('/media', mediaLimiter, mediaRoutes);
app.use('/api/network', networkRoutes); // Phase 2.1: Network Effects
app.use('/api/tags', taggingRoutes); // Phase 2.1: Tagging System
app.use('/api/mergers', mergerRoutes); // Phase 2.1: Story Mergers
app.use('/api/engagement', engagementRoutes); // Phase 2.2: Engagement & Retention
app.use('/api/rewind', rewindRoutes); // Phase 2.2: Rewind Feature
app.use('/api/gamification', gamificationRoutes); // Phase 2.3: Gamification
app.use('/api/referral', referralRoutes); // Phase 2.3: Referrals

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Handler - must be after all routes
app.use(notFoundHandler);

// Global Error Handler - must be last
app.use(errorHandler);

export default app;
