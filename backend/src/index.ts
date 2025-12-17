import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Seed default admin user and templates on first startup
async function seedDatabase() {
    try {
        // Seed admin user
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

        // Seed default templates
        const templateCount = await prisma.template.count();
        if (templateCount === 0) {
            console.log('Seeding default templates...');

            await prisma.template.create({
                data: {
                    title: "Customer Satisfaction Survey",
                    internalName: "customer-satisfaction",
                    introText: "We value your feedback! Please take a moment to rate our service.",
                    htmlDesign: "<style>.survey-container { font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; }</style>",
                    emailSubject: "Feedback Request: {reference}",
                    emailBody: "<p>Dear Customer,</p><p>We would appreciate your feedback. Please click the link below to complete a short survey.</p><p><a href=\"{link}\">Take Survey</a></p><p>Thank you!</p>",
                    commentLabel: "Additional Comments",
                    submitButtonLabel: "Submit Feedback",
                    questions: {
                        create: [
                            { text: "How satisfied were you with our service today?" },
                            { text: "How likely are you to recommend us to a friend?" },
                            { text: "How would you rate the quality of our product/service?" }
                        ]
                    }
                }
            });

            await prisma.template.create({
                data: {
                    title: "Employee Performance Review",
                    internalName: "employee-review",
                    introText: "Please provide your feedback on the employee's performance.",
                    htmlDesign: "<style>.survey-container { font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; }</style>",
                    emailSubject: "Performance Review Request: {reference}",
                    emailBody: "<p>Hello,</p><p>You have been asked to provide feedback. Please click below to complete the review.</p><p><a href=\"{link}\">Complete Review</a></p>",
                    commentLabel: "Additional Feedback",
                    submitButtonLabel: "Submit Review",
                    questions: {
                        create: [
                            { text: "How would you rate the employee's communication skills?" },
                            { text: "How would you rate the employee's work quality?" },
                            { text: "How would you rate the employee's teamwork?" }
                        ]
                    }
                }
            });

            console.log('Default templates created.');
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

