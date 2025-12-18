import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = express.Router();

// GET all templates
router.get('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const templates = await prisma.template.findMany({
            include: { questions: true }
        });
        res.json(templates);
    } catch (error: any) {
        console.error('[Templates GET] Error:', error.message);
        res.status(500).json({ message: 'Error fetching templates' });
    }
});

// POST create template
router.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { title, internalName, introText, logoUrl, htmlDesign, questions, emailSubject, emailBody, commentLabel, submitButtonLabel, thankYouMessage } = req.body;
    try {
        const template = await prisma.template.create({
            data: {
                title: title || 'Feedback Request',
                internalName,
                introText,
                logoUrl,
                htmlDesign,
                emailSubject,
                emailBody,
                commentLabel,
                submitButtonLabel,
                thankYouMessage,
                questions: {
                    create: questions.map((q: string) => ({ text: q }))
                }
            },
            include: { questions: true }
        });
        res.json(template);
    } catch (error: any) {
        console.error('[Templates POST] Error creating template:', error.message);
        res.status(500).json({ message: 'Error creating template' });
    }
});

// PUT update template
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { id } = req.params;
    const { title, internalName, introText, logoUrl, htmlDesign, questions, emailSubject, emailBody, commentLabel, submitButtonLabel, thankYouMessage } = req.body;

    console.log(`[PUT /templates/${id}] Update request received:`, {
        title,
        internalName,
        questionsCount: questions?.length,
        questions,
        hasAnswersCheck: 'Will verify below'
    });

    try {
        // Check if template exists
        const existing = await prisma.template.findUnique({
            where: { id },
            include: { questions: true }
        });
        if (!existing) return res.status(404).json({ message: 'Template not found' });

        // Check if there are answers for this template
        const hasAnswers = await prisma.answer.findFirst({
            where: { question: { templateId: id } }
        });

        if (hasAnswers) {
            // If has answers, only allow updating details, NOT questions
            // Check if questions are different (simplistic check)
            const existingTexts = existing.questions.map(q => q.text).sort().join('|');
            const newTexts = (questions as string[]).sort().join('|');

            if (existingTexts !== newTexts) {
                return res.status(400).json({
                    message: 'Cannot modify questions because this template has already been answered. You can only update the design/intro.'
                });
            }

            // Update only details
            const updated = await prisma.template.update({
                where: { id },
                data: { title, internalName, introText, logoUrl, htmlDesign, emailSubject, emailBody, commentLabel, submitButtonLabel, thankYouMessage },
                include: { questions: true }
            });
            return res.json(updated);
        }

        // If no answers, we can fully replace
        // Transaction to delete old questions and create new ones
        const updated = await prisma.$transaction(async (tx) => {
            await tx.question.deleteMany({ where: { templateId: id } });

            return await tx.template.update({
                where: { id },
                data: {
                    title,
                    internalName,
                    introText,
                    logoUrl,
                    htmlDesign,
                    emailSubject,
                    emailBody,
                    commentLabel,
                    submitButtonLabel,
                    thankYouMessage,
                    questions: {
                        create: questions.map((q: string) => ({ text: q }))
                    }
                },
                include: { questions: true }
            });
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating template' });
    }
});

// DELETE template
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    const { id } = req.params;
    try {
        // Delete questions first (cascade usually handles this but explicit is safe)
        await prisma.question.deleteMany({ where: { templateId: id } });
        await prisma.template.delete({ where: { id } });
        res.json({ message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting template' });
    }
});

export default router;
