
import { prisma } from "./src/lib/prisma";

async function main() {
    const users = await prisma.user.findMany();
    console.log("Users:", users.length);

    const results = await prisma.result.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' }
    });
    console.log("Recent Results:", results.map(r => ({ slug: r.gameSlug, userId: r.userId, score: r.score })));

    const grouped = await prisma.result.groupBy({
        by: ['gameSlug', 'userId'],
        _count: true
    });
    console.log("Grouped:", grouped);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
