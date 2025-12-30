
import { prisma } from "./src/lib/prisma";

async function main() {
    // 1. Find the user with the most recent authenticated result
    const lastResult = await prisma.result.findFirst({
        where: { NOT: { userId: null } },
        orderBy: { createdAt: 'desc' },
        select: { userId: true }
    });

    if (!lastResult || !lastResult.userId) {
        console.log("No authenticated user found recently.");
        return;
    }

    const targetUserId = lastResult.userId;
    console.log("Target User:", targetUserId);

    // 2. Find anonymous results from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const orphans = await prisma.result.findMany({
        where: {
            userId: null,
            createdAt: { gt: yesterday }
        }
    });

    console.log(`Found ${orphans.length} orphan results.`);

    // 3. Update them
    const update = await prisma.result.updateMany({
        where: {
            userId: null,
            createdAt: { gt: yesterday }
        },
        data: { userId: targetUserId }
    });

    console.log(`Updated ${update.count} results.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
