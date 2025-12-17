const pkg = require('@prisma/client');
console.log('Imported keys:', Object.keys(pkg));
const { PrismaClient } = pkg;
console.log('PrismaClient type:', typeof PrismaClient);
if (typeof PrismaClient === 'function') {
    try {
        // Try simplest init
        // const prisma = new PrismaClient(); 
        // Or with explicit datasources if needed
        console.log('Attempting instantiation...');
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: "file:./dev.db"
                }
            }
        });
        console.log('Success!');
    } catch (e) {
        console.error('Instantiation failed:', e.message);
    }
}
