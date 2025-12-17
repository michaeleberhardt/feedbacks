
import { sendEmail } from './lib/email';
import { prisma } from './lib/prisma';

async function main() {
    console.log('Sending test email...');
    const success = await sendEmail({
        to: 'meb@ec-office.de', // Target from error message
        subject: 'Anti-Spam Test',
        body: '<h1>This is a test</h1><p>Checking if spam headers work.</p>',
        text: 'This is a test\nChecking if spam headers work.',
    });
    console.log('Use text: true, use html: true');
    console.log('Success:', success);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
