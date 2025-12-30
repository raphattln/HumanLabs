
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Performance Verification...");
    const email = `test.perf.${Date.now()}@example.com`;
    const password = "Password123!";
    const baseUrl = "http://localhost:3001";
    let cookie = "";

    // 1. CREATE USER & LOGIN
    await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword: password })
    });
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    cookie = loginRes.headers.get('set-cookie').split(';')[0];
    console.log("✅ Logged in.");

    // 2. SIMULATE REACTION TIME PLAY
    console.log(`\n2. Simulating Reaction Time play (Score: 300ms)...`);
    await fetch(`${baseUrl}/api/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cookie": cookie },
        body: JSON.stringify({ gameSlug: "reaction-time", value: 300, meta: { reaction_time: 300 } })
    });

    // 3. FETCH PERFORMANCE SUMMARY
    console.log(`\n3. Fetching Performance Summary...`);
    const summaryRes = await fetch(`${baseUrl}/api/performance/summary`, {
        headers: { "Cookie": cookie }
    });
    const summary = await summaryRes.json();

    // 4. VERIFY
    const rtStats = summary.find(s => s.gameSlug === "reaction-time");
    if (rtStats) {
        console.log("Stats found for Reaction Time:", rtStats);
        if (rtStats.best === 300 && rtStats.plays === 1) {
            console.log("✅ Reaction Time stats correct (Best: 300, Plays: 1).");
        } else {
            console.error("❌ Stats incorrect.");
            process.exit(1);
        }
    } else {
        console.error("❌ Stats for Reaction Time NOT FOUND in summary.");
        console.log("Full summary:", summary);
        process.exit(1);
    }

    // 5. IMPROVE SCORE
    console.log(`\n5. Improving score (250ms)...`);
    await fetch(`${baseUrl}/api/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cookie": cookie },
        body: JSON.stringify({ gameSlug: "reaction-time", value: 250 })
    });

    const summaryRes2 = await fetch(`${baseUrl}/api/performance/summary`, { headers: { "Cookie": cookie } });
    const summary2 = await summaryRes2.json();
    const rtStats2 = summary2.find(s => s.gameSlug === "reaction-time");

    if (rtStats2.best === 250 && rtStats2.plays === 2) {
        console.log("✅ Stats updated correctly (Best: 250, Plays: 2).");
    } else {
        console.error(`❌ Stats update incorrect. Expected Best 250. Got ${rtStats2.best}.`);
        process.exit(1);
    }

    console.log("\n✅ Games & Performance Verification Completed.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
