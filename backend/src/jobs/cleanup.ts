import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { logInfo, logError } from '../lib/logger';

// Default settings
const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_CLEANUP_ENABLED = true;

async function getCleanupSettings(): Promise<{ enabled: boolean; retentionDays: number }> {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['cleanup_enabled', 'cleanup_retention_days'] }
            }
        });

        const config = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);

        return {
            enabled: config.cleanup_enabled !== 'false', // Default to true if not set
            retentionDays: parseInt(config.cleanup_retention_days || String(DEFAULT_RETENTION_DAYS), 10)
        };
    } catch (error) {
        // Return defaults on error
        return { enabled: DEFAULT_CLEANUP_ENABLED, retentionDays: DEFAULT_RETENTION_DAYS };
    }
}

async function runCleanup() {
    const { enabled, retentionDays } = await getCleanupSettings();

    if (!enabled) {
        logInfo('system', 'Cleanup job skipped (disabled in settings)');
        return;
    }

    logInfo('system', `Running cleanup job (retention: ${retentionDays} days)`);

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - retentionDays);

    try {
        const result = await prisma.survey.deleteMany({
            where: {
                createdAt: {
                    lt: dateThreshold
                }
            }
        });

        logInfo('system', `Cleanup complete. Deleted ${result.count} old surveys.`, {
            deletedCount: result.count,
            retentionDays,
            threshold: dateThreshold.toISOString()
        });
    } catch (error: any) {
        logError('system', 'Error during cleanup job', { error: error.message });
    }
}

export const startCleanupJob = () => {
    // Run every day at midnight: '0 0 * * *'
    cron.schedule('0 0 * * *', runCleanup);

    console.log('Cleanup job scheduled (Daily at 00:00).');
};

// Export for manual trigger if needed
export const triggerCleanup = runCleanup;
