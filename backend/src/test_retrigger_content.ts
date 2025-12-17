
import { sendEmail } from './lib/email';
import { prisma } from './lib/prisma';

async function main() {
    console.log('Testing "Retrigger" email content reproduction...');

    // Mock data mimicking the retrigger endpoint
    const reference = "Ref-Test-123";
    const surveyId = "test-survey-id-123";
    const surveyLink = `http://localhost:5174/survey/${surveyId}`;

    const subject = `Feedback Request: ${reference}`;

    // Exact HTML structure from surveys.ts
    const bodyContent = `<div><p>Please provide your feedback.</p><p><a href="${surveyLink}">Click here</a></p></div>`;

    const finalHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                ${bodyContent}
                <hr>
                <small>This is an automated message.</small>
            </div>
        `;

    const plainText = bodyContent.replace(/<[^>]*>?/gm, '') + `\n\nLink: ${surveyLink}`;

    console.log('Sending email with Localhost Link...');
    const success = await sendEmail({
        to: 'meb@ec-office.de',
        subject: subject,
        body: finalHtml,
        text: plainText,
        surveyId: 'debug-test'
    });

    console.log('Send Result:', success);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
