import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = express.Router();

// GET all settings
router.get('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        // Convert array [{key, value}] to object {key: value}
        const settingsObj: Record<string, string> = {};
        settings.forEach((s: { key: string; value: string }) => {
            settingsObj[s.key] = s.value;
        });
        res.json(settingsObj);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// POST update settings (upsert)
router.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const settings = req.body; // Expect { key: value, ... }

    try {
        const updatePromises = Object.entries(settings).map(([key, value]) => {
            return prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            });
        });

        await prisma.$transaction(updatePromises);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// POST send test email
router.post('/test-email', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { to } = req.body;
    if (!to) return res.status(400).json({ message: 'Recipient email is required' });

    try {
        const { sendEmail } = require('../lib/email'); // Lazy import to avoid cycle if any
        const success = await sendEmail({
            to,
            subject: 'Test Email - Customer Feedback App',
            body: 'This is a test email from your Customer Feedback Application. If you see this, your SMTP settings are configured correctly.',
        });

        if (success) {
            res.json({ message: 'Test email sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send test email. Check server logs for details.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send test email' });
    }
});

export default router;
