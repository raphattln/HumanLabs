
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
    console.log('--- Diagnostic Start ---');

    // 1. Check Env
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is not defined in process.env');
    } else {
        // Mask password
        const masked = dbUrl.replace(/:([^:@]+)@/, ':****@');
        console.log(`✅ DATABASE_URL found: ${masked}`);
    }

    // 2. Test Connection
    const prisma = new PrismaClient();
    try {
        console.log('Checking connection...');
        await prisma.$connect();
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('✅ Connection successful. Result:', result);
    } catch (e) {
        console.error('❌ Connection failed.');
        console.error('Stack trace:', e);
    } finally {
        await prisma.$disconnect();
    }
    console.log('--- Diagnostic End ---');
}

main();
