import cron from 'node-cron';
import { prisma } from '../lib/prisma';

export const startCleanupJob = () => {
    // Run every day at midnight: '0 0 * * *'
    cron.schedule('0 0 * * *', async () => {
        console.log('Running 30-day auto-cleanup job...');
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
        } catch (error) {
            console.error('Error during cleanup job:', error);
        }
    });

    console.log('Cleanup job scheduled (Daily at 00:00).');
};
