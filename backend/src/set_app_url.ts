
import { prisma } from './lib/prisma';

async function main() {
    console.log('Setting APP_URL...');

    await prisma.systemSetting.upsert({
        where: { key: 'app_url' },
        update: { value: 'http://example.com' }, // Use a neutral domain for testing, or user's actual domain
        create: { key: 'app_url', value: 'http://example.com' }
    });

    console.log('APP_URL set to http://example.com');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
