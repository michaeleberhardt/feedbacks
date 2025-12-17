import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Seed default admin user on first startup
async function seedDatabase() {
    try {
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
            console.log(`Default admin user created: ${adminEmail}`);
            console.log('IMPORTANT: Change the default password after first login!');
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

import authRoutes from './routes/auth';
import templateRoutes from './routes/templates';
import surveyRoutes from './routes/surveys';
import settingsRoutes from './routes/settings';
import userRoutes from './routes/users';
import logRoutes from './routes/logs';

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/templates', templateRoutes);
app.use('/surveys', surveyRoutes);
app.use('/settings', settingsRoutes);
import apiKeyRoutes from './routes/api-keys';
app.use('/api-keys', apiKeyRoutes);
app.use('/logs', logRoutes);

// Static uploads
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// File Upload
import multer from 'multer';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

app.get('/', (req, res) => {
    res.send('Customer Feedback API');
});

import { startCleanupJob } from './jobs/cleanup';

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await seedDatabase();
    startCleanupJob();
});

