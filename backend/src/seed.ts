import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const email = 'admin@example.com';
    // Check if admin exists to avoid overwriting or errors on re-seed
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) {
        const password = await bcrypt.hash('admin123', 10);
        const user = await prisma.user.create({
            data: {
                email,
                password,
                role: 'ADMIN',
            },
        });
        console.log('Admin created:', user.email);
    } else {
        console.log('Admin already exists.');
    }

    // Seed Templates
    const templateCount = await prisma.template.count();
    if (templateCount === 0) {
        console.log('Seeding templates...');

        await prisma.template.create({
            data: {
                title: "Customer Satisfaction Survey",
                introText: "We value your feedback! Please take a moment to rate our service.",
                htmlDesign: "<style>body { font-family: sans-serif; }</style>",
                questions: {
                    create: [
                        { text: "How satisfied were you with our service today?" },
                        { text: "How likely are you to recommend us to a friend?" }
                    ]
                }
            }
        });

        await prisma.template.create({
            data: {
                title: "Employee Engagement",
                introText: "Your opinion matters to us. Please share your thoughts.",
                htmlDesign: "<style>body { font-family: serif; color: #333; }</style>",
                questions: {
                    create: [
                        { text: "Do you feel valued at work?" },
                        { text: "Do you have the tools you need to succeed?" }
                    ]
                }
            }
        });

        console.log('Templates seeded.');
    } else {
        console.log('Templates already exist, skipping seed.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
