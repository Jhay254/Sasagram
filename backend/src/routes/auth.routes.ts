import { Router } from 'express';
import { authService } from '../services/auth/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        // Zod validation already applied via middleware
        const { email, password, name } = req.body;

        const result = await authService.register(email, password, name);

        res.status(201).json(result);
    } catch (error) {
        if ((error as Error).message === 'User already exists with this email') {
            return res.status(409).json({ error: (error as Error).message });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /auth/login
 * Login user
 */
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        // Zod validation already applied via middleware
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        res.json(result);
    } catch (error) {
        if ((error as Error).message === 'Invalid credentials') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', validate(refreshTokenSchema), async (req, res) => {
    try {
        // Zod validation already applied via middleware
        const { refreshToken } = req.body;

        const result = await authService.refreshAccessToken(refreshToken);

        res.json(result);
    } catch (error) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
});

/**
 * POST /auth/logout
 * Logout user (revoke refresh token)
 */
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        await authService.logout(refreshToken);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

/**
 * GET /auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await authService.getUserById(req.user!.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
