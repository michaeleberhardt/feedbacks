import { prisma } from './prisma';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';
type LogSource = 'surveys' | 'email' | 'auth' | 'templates' | 'settings' | 'api-keys' | 'system';

interface LogOptions {
    level: LogLevel;
    source: LogSource;
    message: string;
    details?: Record<string, any>;
}

// Fire-and-forget logging to database
export const log = async ({ level, source, message, details }: LogOptions): Promise<void> => {
    // Also log to console
    const consoleMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
    consoleMethod(`[${level}] [${source}] ${message}`, details || '');

    // Store in database (don't await, fire-and-forget)
    prisma.backendLog.create({
        data: {
            level,
            source,
            message,
            details: details ? JSON.stringify(details) : null
        }
    }).catch(err => {
        console.error('[Logger] Failed to write log to database:', err.message);
    });
};

// Convenience methods
export const logInfo = (source: LogSource, message: string, details?: Record<string, any>) =>
    log({ level: 'INFO', source, message, details });

export const logWarn = (source: LogSource, message: string, details?: Record<string, any>) =>
    log({ level: 'WARN', source, message, details });

export const logError = (source: LogSource, message: string, details?: Record<string, any>) =>
    log({ level: 'ERROR', source, message, details });
