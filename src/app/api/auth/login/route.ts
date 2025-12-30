
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-utils";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    const requestId = crypto.randomBytes(8).toString("hex");
    const startTime = Date.now();

    console.log("\n" + "=".repeat(80));
    console.log(`[${requestId}] LOGIN REQUEST STARTED at ${new Date().toISOString()}`);
    console.log("=".repeat(80));

    try {
        const body = await request.json();
        const { email, password } = body;

        console.log(`[${requestId}] Login attempt for email:`, email ? `${email.substring(0, 3)}***` : "undefined");

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                {
                    error: "Email and password are required",
                    error_code: "MISSING_FIELD",
                    request_id: requestId
                },
                { status: 400 }
            );
        }

        // Test DB connection
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (dbError: any) {
            console.error(`[${requestId}] DATABASE CONNECTION FAILED:`, dbError.message);
            return NextResponse.json(
                {
                    error: "Database connection failed",
                    error_code: "DB_CONNECT_FAILED",
                    request_id: requestId
                },
                { status: 503 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            console.log(`[${requestId}] User not found`);
            return NextResponse.json(
                {
                    error: "Invalid email or password",
                    error_code: "INVALID_CREDENTIALS",
                    request_id: requestId
                },
                { status: 401 }
            );
        }

        // Check verification status - REMOVED for immediate access
        // if (!user.emailVerified) { ... }


        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash || "");

        if (!isValid) {
            console.log(`[${requestId}] Invalid password`);
            return NextResponse.json(
                {
                    error: "Invalid email or password",
                    error_code: "INVALID_CREDENTIALS",
                    request_id: requestId
                },
                { status: 401 }
            );
        }

        // Create Session
        console.log(`[${requestId}] Creating session...`);
        const sessionToken = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        try {
            await prisma.session.create({
                data: {
                    sessionToken,
                    userId: user.id,
                    expires,
                },
            });
        } catch (sessionError: any) {
            console.error(`[${requestId}] Failed to create session:`, sessionError);
            return NextResponse.json(
                {
                    error: "Failed to create session",
                    error_code: "SESSION_CREATION_FAILED",
                    request_id: requestId
                },
                { status: 500 }
            );
        }

        // Set Cookie
        // Note: Using 'auth_token' as generic name since we are doing custom auth.
        // If integrating with NextAuth, we might need to match its expectations, 
        // but explicit requirements asked for "créer session cookie".
        const cookieStore = await cookies();
        cookieStore.set("auth_token", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: expires,
            path: "/",
        });

        console.log(`[${requestId}] Login successful`);
        console.log("=".repeat(80) + "\n");

        return NextResponse.json(
            {
                message: "Login successful",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.displayName,
                },
                request_id: requestId
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(`[${requestId}] UNEXPECTED ERROR:`, error);
        return NextResponse.json(
            {
                error: "An unexpected error occurred",
                error_code: "INTERNAL_ERROR",
                request_id: requestId
            },
            { status: 500 }
        );
    }
}
