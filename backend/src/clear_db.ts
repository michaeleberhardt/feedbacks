
import { prisma } from './lib/prisma';

async function main() {
    console.log('Clearing database...');
    // Delete in order to satisfy foreign keys
    await prisma.emailLog.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.survey.deleteMany();
    await prisma.question.deleteMany();
    await prisma.template.deleteMany();
    console.log('Database cleared (Templates and related data).');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
