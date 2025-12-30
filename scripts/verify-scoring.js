
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Scoring & Badge Verification...");
    const email = `test.score.${Date.now()}@example.com`;
    const password = "Password123!";
    const baseUrl = "http://localhost:3001";
    let cookie = "";

    // 1. CREATE USER & LOGIN
    console.log(`\n1. Signup & Login user...`);
    // Signup
    await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword: password })
    });
    // Login to get cookie
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
        cookie = setCookie.split(';')[0];
        console.log("✅ Logged in, cookie obtained.");
    } else {
        console.error("❌ Login failed (no cookie)");
        process.exit(1);
    }

    // 2. SUBMIT SCORE (Reaction Time - First Game)
    console.log(`\n2. Submitting Score (Reaction Time: 250ms)...`);
    const scoreRes = await fetch(`${baseUrl}/api/scores`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": cookie
        },
        body: JSON.stringify({
            gameSlug: "reaction-time",
            value: 250,
            durationMs: 5000
        })
    });
    const scoreData = await scoreRes.json();
    console.log("Response:", scoreData);

    if (scoreData.success && scoreData.newBadges.includes('first_game')) {
        console.log("✅ Score saved and 'first_game' badge awarded!");
    } else {
        console.error("❌ Score submission failed or badge missing:", scoreData);
        process.exit(1);
    }

    // 3. CHECK USER STATS
    console.log(`\n3. Checking User Stats Overview...`);
    const statsRes = await fetch(`${baseUrl}/api/stats/overview`, {
        headers: { "Cookie": cookie }
    });
    const statsData = await statsRes.json();
    console.log("Stats:", statsData);
    if (statsData.totalPlays >= 1) {
        console.log("✅ Stats updated (totalPlays).");
    } else {
        console.error("❌ Stats incorrect.");
    }

    // 4. CHECK LEADERBOARD
    console.log(`\n4. Checking Leaderboard (Reaction Time)...`);
    // Submit a BETTER score (200ms - lower is better)
    await fetch(`${baseUrl}/api/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cookie": cookie },
        body: JSON.stringify({ gameSlug: "reaction-time", value: 200 })
    });

    const lbRes = await fetch(`${baseUrl}/api/leaderboard?slug=reaction-time`);
    const lbData = await lbRes.json();
    // We expect our user to be #1 (or high up) with 200ms
    const entry = lbData.leaderboard.find(e => e.score === 200);
    if (entry) {
        console.log(`✅ User found in leaderboard with score ${entry.score} (Rank ${entry.rank})`);
    } else {
        console.log("Leaderboard data:", lbData.leaderboard.slice(0, 3));
        console.error("❌ User not found in leaderboard with expected best score.");
    }

    // 5. CHECK USER STATS (GAME SPECIFIC)
    console.log(`\n5. Checking Game Stats (Average)...`);
    const gameStatsRes = await fetch(`${baseUrl}/api/stats/game?slug=reaction-time`, {
        headers: { "Cookie": cookie }
    });
    const gameStats = await gameStatsRes.json();
    // scores: 250, 200. Avg should be 225. Best 200.
    console.log("Game Stats:", gameStats);
    if (gameStats.bestScore === 200 && gameStats.averageScore === 225) {
        console.log("✅ Best Score and Average correct.");
    } else {
        console.error(`❌ Game stats mismatch. Expected Best: 200, Avg: 225. Got: Best ${gameStats.bestScore}, Avg ${gameStats.averageScore}`);
    }

    console.log("\n✅ Scoring & Badge Verification Completed.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
