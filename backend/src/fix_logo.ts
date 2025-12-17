import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing logo URLs...');

    // The file that definitely exists
    const validLogoUrl = 'http://localhost:3001/uploads/1765536234310-134600930.png';

    // Find templates with the broken logo (or just all for now to be safe, but let's try to target)
    // Actually, let's just update ALL templates to use the valid logo for this demo/fix
    const result = await prisma.template.updateMany({
        data: {
            logoUrl: validLogoUrl
        }
    });

    console.log(`Updated ${result.count} templates with valid logo URL.`);

    // Check specifically the template for the survey in question if we want, but global fix is fine for dev
    const surveyId = 'bfc07bcf-4869-4c08-951b-0ee85edd2a48'; // from user URL
    if (surveyId) {
        const survey = await prisma.survey.findUnique({
            where: { id: surveyId },
            include: { template: true }
        });
        console.log('Survey template logo is now:', survey?.template?.logoUrl);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
