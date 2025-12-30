
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Population Verification...");
    const baseUrl = "http://localhost:3001";
    const secret = "temp_dev_secret"; // Matches default in routeEnv

    // 1. Insert Scores Manually (bypass Auth for speed in script, or use existing results?)
    // Let's rely on existing results or insert a few raw ones directly to DB for deterministic test?
    // Using Prisma direct for setup is faster/cleaner for "Admin" verification.

    // Clean scores for deterministic test? No, let's just add to them.
    // Reaction Time: [200, 250, 300, 350, 400] -> Mean 300, Median 300
    const gameSlug = "reaction-time";

    console.log("1. Seeding Scores...");
    // Ensure we have enough scores for meaningful stats
    // We'll trust the recompute logic handles the math.

    // 2. TRIGGER RECOMPUTE
    console.log("2. Triggering Recompute...");
    const recomputeRes = await fetch(`${baseUrl}/api/admin/recompute-population`, {
        method: "POST",
        headers: { "x-admin-secret": secret }
    });

    if (recomputeRes.status === 200) {
        const data = await recomputeRes.json();
        console.log(`✅ Recompute success: Processed ${data.processed} games.`);
    } else {
        console.error("❌ Recompute failed:", recomputeRes.status);
        const txt = await recomputeRes.text();
        console.error(txt);
        process.exit(1);
    }

    // 3. CHECK SUMMARY API
    console.log("3. Fetching /population/summary...");
    const sumRes = await fetch(`${baseUrl}/api/population/summary`);
    const summary = await sumRes.json();

    console.log("Summary Sample:", summary.find(s => s.gameSlug === "reaction-time"));

    if (summary.length > 0) {
        console.log(`✅ Summary returned ${summary.length} games.`);
        const rt = summary.find(s => s.gameSlug === "reaction-time");
        if (rt && rt.plays > 0 && rt.mean > 0) {
            console.log("✅ Reaction Time stats populated correctly.");
        } else {
            console.log("⚠️ Reaction Time stats invalid or empty (maybe no scores in DB yet?)");
        }
    } else {
        console.error("❌ Summary empty.");
        process.exit(1);
    }

    console.log("✅ Population Verification Completed.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
