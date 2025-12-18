import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Helper to safely read package.json
function readPackageJson(filePath: string): Record<string, any> | null {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

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

// GET system info (versions)
router.get('/info', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        // Read backend package.json
        const backendPkg = readPackageJson(path.join(__dirname, '../../package.json'));

        // Get installed versions from node_modules
        const getInstalledVersion = (pkgName: string): string => {
            try {
                const pkgPath = path.join(__dirname, '../../node_modules', pkgName, 'package.json');
                const pkg = readPackageJson(pkgPath);
                return pkg?.version || 'unknown';
            } catch {
                return 'unknown';
            }
        };

        const backend = {
            node: process.version,
            express: getInstalledVersion('express'),
            prisma: getInstalledVersion('@prisma/client'),
            typescript: getInstalledVersion('typescript'),
            nodemailer: getInstalledVersion('nodemailer'),
            helmet: getInstalledVersion('helmet'),
            jsonwebtoken: getInstalledVersion('jsonwebtoken'),
            bcryptjs: getInstalledVersion('bcryptjs'),
            nodeCron: getInstalledVersion('node-cron'),
        };

        // Frontend versions (from package.json since we can't read node_modules at runtime)
        const frontendPkgPath = path.join(__dirname, '../../../frontend/package.json');
        const frontendPkg = readPackageJson(frontendPkgPath);

        const frontend = frontendPkg ? {
            react: frontendPkg.dependencies?.react?.replace('^', '') || 'unknown',
            reactDom: frontendPkg.dependencies?.['react-dom']?.replace('^', '') || 'unknown',
            mui: frontendPkg.dependencies?.['@mui/material']?.replace('^', '') || 'unknown',
            reactRouter: frontendPkg.dependencies?.['react-router-dom']?.replace('^', '') || 'unknown',
            axios: frontendPkg.dependencies?.axios?.replace('^', '') || 'unknown',
            vite: frontendPkg.devDependencies?.vite || 'unknown',
            typescript: frontendPkg.devDependencies?.typescript?.replace('~', '') || 'unknown',
        } : null;

        // System info
        const system = {
            platform: process.platform,
            arch: process.arch,
            uptime: Math.floor(process.uptime()),
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        };

        res.json({
            backend,
            frontend,
            system
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching system info' });
    }
});

export default router;
