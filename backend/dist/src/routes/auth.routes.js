"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth/auth.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        const result = await auth_service_1.authService.register(email, password, name);
        res.status(201).json(result);
    }
    catch (error) {
        if (error.message === 'User already exists with this email') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});
/**
 * POST /auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = await auth_service_1.authService.login(email, password);
        res.json(result);
    }
    catch (error) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.status(500).json({ error: 'Login failed' });
    }
});
/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        const result = await auth_service_1.authService.refreshAccessToken(refreshToken);
        res.json(result);
    }
    catch (error) {
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
        await auth_service_1.authService.logout(refreshToken);
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});
/**
 * GET /auth/me
 * Get current user
 */
router.get('/me', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const user = await auth_service_1.authService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
    }
});
exports.default = router;
