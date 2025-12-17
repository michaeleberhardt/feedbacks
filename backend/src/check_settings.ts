
import { prisma } from './lib/prisma';

async function main() {
    console.log('Checking SystemSettings...');
    const settings = await prisma.systemSetting.findMany();
    console.log('Found settings count:', settings.length);
    settings.forEach(s => console.log(`${s.key}: ${s.value}`));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
