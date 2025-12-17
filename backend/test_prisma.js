const { PrismaClient } = require('@prisma/client');
try {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: "file:./dev.db"
            }
        }
    });
    console.log('Prisma Client initialized successfully');
    prisma.$disconnect();
} catch (e) {
    console.error(e);
}
