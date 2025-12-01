"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * Get tiers for a creator
 * GET /api/tiers/:creatorId
 */
router.get('/:creatorId', async (req, res) => {
    try {
        const { creatorId } = req.params;
        const tiers = await prisma.subscriptionTier.findMany({
            where: {
                creatorId,
                isActive: true
            },
            orderBy: { price: 'asc' }
        });
        res.json(tiers);
    }
    catch (error) {
        logger_1.logger.error('Error fetching tiers:', error);
        res.status(500).json({ error: 'Failed to fetch tiers' });
    }
});
/**
 * Create a new tier (Creator only)
 * POST /api/tiers
 */
router.post('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const creatorId = req.user.id;
        const { name, price, features, currency = 'USD' } = req.body;
        if (!name || price === undefined || !features) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const tier = await prisma.subscriptionTier.create({
            data: {
                creatorId,
                name,
                price: parseFloat(price),
                currency,
                features: JSON.stringify(features), // Store as JSON string
                isActive: true
            }
        });
        res.json(tier);
    }
    catch (error) {
        logger_1.logger.error('Error creating tier:', error);
        res.status(500).json({ error: 'Failed to create tier' });
    }
});
/**
 * Update a tier (Creator only)
 * PUT /api/tiers/:id
 */
router.put('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const tierId = req.params.id;
        const creatorId = req.user.id;
        const { name, price, features, isActive } = req.body;
        // Verify ownership
        const existingTier = await prisma.subscriptionTier.findUnique({
            where: { id: tierId }
        });
        if (!existingTier) {
            return res.status(404).json({ error: 'Tier not found' });
        }
        if (existingTier.creatorId !== creatorId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const updateData = {};
        if (name)
            updateData.name = name;
        if (price !== undefined)
            updateData.price = parseFloat(price);
        if (features)
            updateData.features = JSON.stringify(features);
        if (isActive !== undefined)
            updateData.isActive = isActive;
        const updatedTier = await prisma.subscriptionTier.update({
            where: { id: tierId },
            data: updateData
        });
        res.json(updatedTier);
    }
    catch (error) {
        logger_1.logger.error('Error updating tier:', error);
        res.status(500).json({ error: 'Failed to update tier' });
    }
});
/**
 * Delete a tier (soft delete)
 * DELETE /api/tiers/:id
 */
router.delete('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const tierId = req.params.id;
        const creatorId = req.user.id;
        // Verify ownership
        const existingTier = await prisma.subscriptionTier.findUnique({
            where: { id: tierId }
        });
        if (!existingTier) {
            return res.status(404).json({ error: 'Tier not found' });
        }
        if (existingTier.creatorId !== creatorId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        // Soft delete by setting isActive to false
        await prisma.subscriptionTier.update({
            where: { id: tierId },
            data: { isActive: false }
        });
        res.json({ success: true, message: 'Tier deactivated successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error deleting tier:', error);
        res.status(500).json({ error: 'Failed to delete tier' });
    }
});
exports.default = router;
