
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Simplified Auth Flow Verification...");
    const email = `test.simple.${Date.now()}@example.com`;
    const password = "Password123!";
    const baseUrl = "http://localhost:3001";

    // 1. SIGNUP
    console.log(`\n1. Testing SIGNUP with ${email}...`);
    try {
        const res = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, confirmPassword: password })
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);

        if (res.status === 201) {
            console.log("✅ Signup Successful:", data.message);
            if (data.emailVerified !== true) {
                console.error("❌ Expected emailVerified=true in response, got:", data.emailVerified);
                process.exit(1);
            }
        } else {
            console.error("❌ Signup Failed:", data);
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ Signup Network Error:", e.message);
        process.exit(1);
    }

    // 2. CHECK DB DIRECTLY
    const user = await prisma.user.findUnique({ where: { email } });
    if (user.emailVerified) {
        console.log("✅ DB State: User is verified immediately.");
    } else {
        console.error("❌ DB State: User is NOT verified.");
        process.exit(1);
    }

    // 3. ATTEMPT LOGIN (IMMEDIATE)
    console.log(`\n3. Testing LOGIN (Immediate)...`);
    try {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            console.log("✅ Login Successful:", data.message);
            // Check cookies
            const setCookie = res.headers.get('set-cookie');
            if (setCookie && setCookie.includes('auth_token')) {
                console.log("✅ auth_token cookie set.");
            } else {
                console.warn("⚠️  Login success but cookie might be missing (check headers below):");
            }
        } else {
            console.error("❌ Login Failed:", data);
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ Login Network Error:", e.message);
    }

    console.log("\n✅ Simplified Flow Verification Completed.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
