import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = express.Router();

// GET all users
router.get('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, createdAt: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// POST create user
router.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || 'USER'
            },
            select: { id: true, email: true, role: true, createdAt: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

export default router;
