import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = express.Router();

// GET all email logs (Admin only)
router.get('/email', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const logs = await prisma.emailLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit to last 100 logs
        });
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching email logs' });
    }
});

export default router;
