import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import crypto from 'crypto';

const router = express.Router();

// Helper to hash key
const hashKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex');

// GET all keys
router.get('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const keys = await prisma.apiKey.findMany({ select: { id: true, name: true, lastUsed: true, createdAt: true } });
        res.json(keys);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching API keys' });
    }
});

// POST create key
router.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const rawKey = 'sk_' + crypto.randomBytes(32).toString('hex');
    const hashedKey = hashKey(rawKey);

    try {
        const apiKey = await prisma.apiKey.create({
            data: {
                name,
                key: hashedKey
            }
        });
        // Return raw key ONLY once
        res.json({ ...apiKey, rawKey });
    } catch (error) {
        res.status(500).json({ message: 'Error creating API key' });
    }
});

// DELETE key
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.apiKey.delete({ where: { id } });
        res.json({ message: 'API key deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting API key' });
    }
});

export default router;
