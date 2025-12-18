import { prisma } from './prisma';
import nodemailer from 'nodemailer';
import { logError, logInfo, logWarn } from './logger';

interface SendEmailOptions {
    to: string;
    subject: string;
    body: string; // HTML
    text?: string; // Plain text version
    surveyId?: string;
}

export const sendEmail = async ({ to, subject, body, text, surveyId }: SendEmailOptions) => {
    logInfo('email', 'Sending email', { to, subject, surveyId });

    // Fetch settings from DB
    const settings = await prisma.systemSetting.findMany({
        where: {
            // Keys: host, port, user, pass, secure, tls_reject, sender_name
            key: { in: ['host', 'port', 'user', 'pass', 'secure', 'tls_reject', 'sender_name'] }
        }
    });

    const config = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);

    // VALIDATION
    if (!config.host || !config.user) {
        logError('email', 'Missing SMTP configuration (Host or User)', { to, subject, surveyId });
        await logEmailResult(to, subject, false, 'Missing SMTP configuration', surveyId);
        return false;
    }

    const secure = config.secure === 'true';
    const rejectUnauthorized = config.tls_reject !== 'false';

    // Create transporter with timeouts
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: parseInt(config.port || '587'),
        secure: secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
        tls: {
            rejectUnauthorized: rejectUnauthorized
        },
        connectionTimeout: 10000, // 10 seconds to connect
        greetingTimeout: 10000,   // 10 seconds for greeting
        socketTimeout: 30000      // 30 seconds for socket inactivity
    });

    let success = false;
    let errorDetails: string | null = null;

    // Generate Message-ID
    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${config.host}>`;

    try {
        await transporter.verify();
        const senderName = config.sender_name || config.user.split('@')[0];
        await transporter.sendMail({
            from: `"${senderName}" <${config.user}>`, // Format: "Name" <email>
            to: to,
            subject: subject,
            html: body,
            text: text || body.replace(/<[^>]*>?/gm, ''), // Fallback text if not provided
            headers: {
                'Message-ID': messageId,
                'Date': new Date().toUTCString(),
                'X-Mailer': 'Nodemailer/APP',
                'List-Unsubscribe': `<mailto:${config.user}?subject=unsubscribe>`
            }
        });
        success = true;
        logInfo('email', 'Email sent successfully', { to, subject, surveyId });
    } catch (error: any) {
        success = false;
        errorDetails = error.message || 'Unknown SMTP error';
        logError('email', 'Failed to send email', { to, subject, surveyId, error: errorDetails });
    }

    await logEmailResult(to, subject, success, errorDetails, surveyId);
    return success;
};

async function logEmailResult(to: string, subject: string, success: boolean, errorDetails: string | null, surveyId?: string) {
    try {
        await prisma.emailLog.create({
            data: {
                surveyId: surveyId || null,
                recipient: to,
                subject: subject,
                status: success ? 'SUCCESS' : 'ERROR',
                errorDetails: errorDetails
            }
        });
    } catch (error) {
        console.error('Failed to log email:', error);
    }
}
