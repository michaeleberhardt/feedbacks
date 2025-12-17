import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

export const authorizeRole = (role: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            res.sendStatus(403);
        }
    }
}

// Validate API Key Middleware
export const authenticateApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.headers['x-api-key'];
    if (!apiKeyHeader || Array.isArray(apiKeyHeader)) {
        return res.status(401).json({ message: 'API Key required' });
    }

    const hashedKey = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');

    try {
        const apiKey = await prisma.apiKey.findUnique({ where: { key: hashedKey } });
        if (!apiKey) {
            return res.status(403).json({ message: 'Invalid API Key' });
        }

        // Update last used (fire and forget to not block)
        prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsed: new Date() }
        }).catch(err => console.error('Failed to update lastUsed', err));

        // Attach dummy user or context if needed, or just proceed
        // req.user = { role: 'API' }; // Optional: signify this is an API call
        next();
    } catch (error) {
        console.error('API Key validation error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const authenticateTokenOrApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.headers['x-api-key'];
    if (apiKeyHeader) {
        return authenticateApiKey(req, res, next);
    }
    return authenticateToken(req, res, next);
};
