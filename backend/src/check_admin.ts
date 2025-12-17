
import { prisma } from './lib/prisma';

async function main() {
    console.log('Checking for admin user...');
    const user = await prisma.user.findUnique({
        where: { email: 'admin@example.com' }
    });
    if (user) {
        console.log('Admin user found:', user.email);
        console.log('Role:', user.role);
        console.log('Password hash length:', user.password.length);
    } else {
        console.log('Admin user NOT FOUND.');
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
