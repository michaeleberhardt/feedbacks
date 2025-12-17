import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillScores() {
    console.log('Starting backfill of average scores...');

    try {
        const surveys = await prisma.survey.findMany({
            where: {
                status: 'answered',
                averageScore: null
            },
            include: {
                answers: true
            }
        });

        console.log(`Found ${surveys.length} surveys to update.`);

        for (const survey of surveys) {
            const values = survey.answers.map(a => a.value);
            const averageScore = values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0;

            await prisma.survey.update({
                where: { id: survey.id },
                data: { averageScore }
            });
            console.log(`Updated survey ${survey.reference} (${survey.id}) with score ${averageScore}`);
        }

        console.log('Backfill complete.');
    } catch (error) {
        console.error('Backfill failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backfillScores();
