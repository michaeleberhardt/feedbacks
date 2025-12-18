import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, authorizeRole, authenticateTokenOrApiKey } from '../middleware/auth';
import { sendEmail } from '../lib/email';

const router = express.Router();

// POST trigger new survey
router.post('/', authenticateTokenOrApiKey, async (req, res) => {
    const { templateId, reference, employee, addresseeEmail } = req.body;
    try {
        const survey = await prisma.survey.create({
            data: {
                templateId,
                reference,
                employee,
                addresseeEmail,
                status: 'open'
            },
            include: {
                template: true
            }
        });

        // Send and log email
        // Send and log email
        // Send and log email
        const settings = await prisma.systemSetting.findUnique({ where: { key: 'app_url' } });
        const appUrl = settings?.value || 'http://localhost:5174';
        const surveyLink = `${appUrl}/survey/${survey.id}`;

        // Prepare dynamic email content
        const template = survey.template;
        const subject = (template.emailSubject || 'Feedback Request: {reference}')
            .replace(/{reference}/g, reference || '');

        const bodyContent = (template.emailBody || '<div><p>Please provide your feedback.</p><p><a href="{link}">Click here</a></p></div>')
            .replace(/{reference}/g, reference || '')
            .replace(/{link}/g, surveyLink);

        // Wrap in standard container if not already HTML document (optional, but good for consistency)
        // For now, we trust the template body to be sufficient HTML or we wrap it in a basic div if it's plain
        const finalHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="text-align: center; margin-bottom: 20px;">
                     ${template.logoUrl ? `<img src="${template.logoUrl}" alt="Logo" style="max-height: 50px;">` : ''}
                </div>
                ${bodyContent}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <small style="color: #666;">This is an automated message.</small>
            </div>
        `;

        const plainText = bodyContent.replace(/<[^>]*>?/gm, '').trim() + `\n\nTo participate, please visit:\n${surveyLink}`;

        await sendEmail({
            to: addresseeEmail,
            subject: subject,
            body: finalHtml,
            text: plainText,
            surveyId: survey.id
        });

        res.json(survey);
    } catch (error) {
        res.status(500).json({ message: 'Error creating survey' });
    }
});

// POST re-trigger survey (resend email)
router.post('/:id/retrigger', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const survey = await prisma.survey.findUnique({
            where: { id },
            include: { template: true }
        });
        if (!survey) return res.status(404).json({ message: 'Survey not found' });
        if (survey.status !== 'open') return res.status(400).json({ message: 'Cannot retrigger closed survey' });

        const settings = await prisma.systemSetting.findUnique({ where: { key: 'app_url' } });
        const appUrl = settings?.value || 'http://localhost:5174';
        const surveyLink = `${appUrl}/survey/${survey.id}`;

        // Prepare dynamic email content
        const template = survey.template;
        const subject = (template.emailSubject || 'Feedback Request: {reference}')
            .replace(/{reference}/g, survey.reference || '');

        const bodyContent = (template.emailBody || '<div><p>Please provide your feedback.</p><p><a href="{link}">Click here</a></p></div>')
            .replace(/{reference}/g, survey.reference || '')
            .replace(/{link}/g, surveyLink);

        const finalHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="text-align: center; margin-bottom: 20px;">
                     ${template.logoUrl ? `<img src="${template.logoUrl}" alt="Logo" style="max-height: 50px;">` : ''}
                </div>
                ${bodyContent}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <small style="color: #666;">This is an automated message.</small>
            </div>
        `;
        const plainText = bodyContent.replace(/<[^>]*>?/gm, '').trim() + `\n\nTo participate, please visit:\n${surveyLink}`;

        const emailSuccess = await sendEmail({
            to: survey.addresseeEmail,
            subject: subject,
            body: finalHtml,
            text: plainText,
            surveyId: survey.id
        });

        if (!emailSuccess) {
            return res.status(500).json({ message: 'Failed to send email (check SMTP settings)' });
        }

        res.json({ message: 'Survey re-triggered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error re-triggering survey' });
    }
});

// GET list surveys (with filters)
router.get('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { ref, employee, status } = req.query;

    // Build filter object
    const where: any = {};
    if (ref) {
        where.OR = [
            { reference: { contains: String(ref) } },
            { addresseeEmail: { contains: String(ref) } }
        ];
    }
    if (employee) where.employee = { contains: String(employee) };
    if (status && status !== 'all') where.status = String(status);

    // Date filter
    const { startDate, endDate } = req.query;
    if (startDate && endDate) {
        where.createdAt = {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate))
        };
    } else if (startDate) {
        where.createdAt = { gte: new Date(String(startDate)) };
    } else if (endDate) {
        where.createdAt = { lte: new Date(String(endDate)) };
    }

    try {
        const surveys = await prisma.survey.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                template: {
                    include: { questions: true }
                },
                answers: true
            }
        });
        res.json(surveys);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching surveys' });
    }
});

// GET /stats - Global Analytics
router.get('/stats', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { ref, employee } = req.query;

    const baseWhere: any = { status: 'answered' };
    if (ref) {
        baseWhere.OR = [
            { reference: { contains: String(ref) } },
            { addresseeEmail: { contains: String(ref) } }
        ];
    }
    if (employee) baseWhere.employee = { contains: String(employee) };

    try {
        const now = new Date();
        const startYear = new Date(now.getFullYear(), 0, 1);
        const currentMonth = now.getMonth();
        const startQuarter = new Date(now.getFullYear(), Math.floor(currentMonth / 3) * 3, 1);
        const startMonth = new Date(now.getFullYear(), currentMonth, 1);

        const [yearStats, quarterStats, monthStats] = await Promise.all([
            prisma.survey.aggregate({
                _avg: { averageScore: true },
                where: { ...baseWhere, createdAt: { gte: startYear } }
            }),
            prisma.survey.aggregate({
                _avg: { averageScore: true },
                where: { ...baseWhere, createdAt: { gte: startQuarter } }
            }),
            prisma.survey.aggregate({
                _avg: { averageScore: true },
                where: { ...baseWhere, createdAt: { gte: startMonth } }
            })
        ]);

        res.json({
            year: yearStats._avg.averageScore || 0,
            quarter: quarterStats._avg.averageScore || 0,
            month: monthStats._avg.averageScore || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// GET Public Survey Details (for rendering)
router.get('/:id/public', async (req, res) => {
    try {
        const survey = await prisma.survey.findUnique({
            where: { id: req.params.id },
            include: {
                template: {
                    include: { questions: true }
                }
            }
        });
        if (!survey) return res.status(404).json({ message: 'Survey not found' });
        if (survey.status === 'answered') return res.status(400).json({ message: 'Survey already answered' });

        // Return only necessary data for public view
        res.json({
            id: survey.id,
            reference: survey.reference,
            template: survey.template
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching survey' });
    }
});

// POST Submit Survey
router.post('/:id/submit', async (req, res) => {
    const { id } = req.params;
    const { answers, comment } = req.body; // answers: { questionId: value }

    try {
        const survey = await prisma.survey.findUnique({ where: { id } });
        if (!survey || survey.status !== 'open') {
            return res.status(400).json({ message: 'Invalid survey or already answered' });
        }

        // Transaction to save answers and update status
        await prisma.$transaction(async (tx: any) => {
            // Create answers
            for (const [qId, value] of Object.entries(answers)) {
                await tx.answer.create({
                    data: {
                        surveyId: id,
                        questionId: qId,
                        value: Number(value)
                    }
                });
            }

            // Calculate average score
            const values = Object.values(answers).map(Number);
            const averageScore = values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0;

            // Update survey
            await tx.survey.update({
                where: { id },
                data: {
                    status: 'answered',
                    comment: comment || '',
                    averageScore: averageScore
                }
            });
        });

        res.json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting feedback' });
    }
});

export default router;
