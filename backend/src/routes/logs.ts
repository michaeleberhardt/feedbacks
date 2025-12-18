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

// GET backend logs (Admin only)
router.get('/backend', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { level, source, limit = '100' } = req.query;

    try {
        const where: any = {};
        if (level && level !== 'all') {
            where.level = String(level).toUpperCase();
        }
        if (source && source !== 'all') {
            where.source = String(source);
        }

        const logs = await prisma.backendLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Math.min(parseInt(String(limit)), 500) // Max 500 logs
        });
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching backend logs' });
    }
});

// DELETE clear old backend logs (Admin only)
router.delete('/backend', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await prisma.backendLog.deleteMany({
            where: {
                createdAt: { lt: sevenDaysAgo }
            }
        });

        res.json({ message: `Deleted ${result.count} old log entries` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error clearing logs' });
    }
});

export default router;
