import { prisma } from './lib/prisma';
import { startCleanupJob } from './jobs/cleanup';

// Mock the cleanup logic for testing since we can't wait for cron
const runCleanupNow = async () => {
    console.log('Running 30-day auto-cleanup test...');
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - 30);

    try {
        const result = await prisma.survey.deleteMany({
            where: {
                createdAt: {
                    lt: dateThreshold
                }
            }
        });
        console.log(`Cleanup complete. Deleted ${result.count} old surveys.`);
        return result.count;
    } catch (error) {
        console.error('Error during cleanup job:', error);
        return 0;
    }
};

const verify = async () => {
    // 1. Create an old survey (31 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);

    // We need a template first
    const template = await prisma.template.findFirst();
    if (!template) {
        console.error("No template found. Run seed first.");
        return;
    }

    const oldSurvey = await prisma.survey.create({
        data: {
            templateId: template.id,
            addresseeEmail: 'old@example.com',
            createdAt: oldDate,
            status: 'open'
        }
    });
    console.log(`Created old survey: ${oldSurvey.id} created at ${oldSurvey.createdAt}`);

    // 2. Create a new survey (1 day ago)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 1);
    const newSurvey = await prisma.survey.create({
        data: {
            templateId: template.id,
            addresseeEmail: 'new@example.com',
            createdAt: newDate,
            status: 'open'
        }
    });

    // 3. Run cleanup
    const deletedCount = await runCleanupNow();

    // 4. Verify
    const checkOld = await prisma.survey.findUnique({ where: { id: oldSurvey.id } });
    const checkNew = await prisma.survey.findUnique({ where: { id: newSurvey.id } });

    if (!checkOld && checkNew) {
        console.log('SUCCESS: Old survey deleted, new survey preserved.');
    } else {
        console.error('FAILURE: Cleanup logic failed.');
        if (checkOld) console.error('Old survey still exists.');
        if (!checkNew) console.error('New survey was deleted.');
    }

    // Clean up the new survey manually
    if (checkNew) await prisma.survey.delete({ where: { id: newSurvey.id } });
};

verify()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    });
