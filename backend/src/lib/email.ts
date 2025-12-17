import { prisma } from './prisma';
import nodemailer from 'nodemailer';

interface SendEmailOptions {
    to: string;
    subject: string;
    body: string; // HTML
    text?: string; // Plain text version
    surveyId?: string;
}

export const sendEmail = async ({ to, subject, body, text, surveyId }: SendEmailOptions) => {
    console.log(`[Email] Sending to: ${to}, Subject: ${subject}`);

    // Fetch settings from DB
    const settings = await prisma.systemSetting.findMany({
        where: {
            // Keys: host, port, user, pass, secure, tls_reject
            key: { in: ['host', 'port', 'user', 'pass', 'secure', 'tls_reject'] }
        }
    });

    const config = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);

    // VALIDATION
    if (!config.host || !config.user) {
        console.error('[Email] FAILED: Missing SMTP configuration (Host or User).');
        await logEmailResult(to, subject, false, 'Missing SMTP configuration', surveyId);
        return false;
    }

    const secure = config.secure === 'true';
    const rejectUnauthorized = config.tls_reject !== 'false';

    console.log(`[Email] Configured Host: ${config.host}, Port: ${config.port}, Secure: ${secure}`);

    // Create transporter
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
        }
    });

    let success = false;
    let errorDetails: string | null = null;

    // Generate Message-ID
    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${config.host}>`;

    try {
        await transporter.verify();
        await transporter.sendMail({
            from: `"${config.user.split('@')[0]}" <${config.user}>`, // Format: "Name" <email>
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
        console.log('[Email] Sent successfully via SMTP');
    } catch (error: any) {
        console.error('[Email] Failed to send:', error);
        success = false;
        errorDetails = error.message || 'Unknown SMTP error';
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
