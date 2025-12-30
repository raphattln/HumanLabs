import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword, generateToken, hashToken } from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    const requestId = crypto.randomBytes(8).toString("hex");
    const startTime = Date.now();

    console.log("\n" + "=".repeat(80));
    console.log(`[${requestId}] SIGNUP REQUEST STARTED at ${new Date().toISOString()}`);
    console.log("=".repeat(80));

    try {
        const body = await request.json();
        let { email, password, confirmPassword } = body;

        console.log(`[${requestId}] Request body:`, {
            email: email ? `${email.substring(0, 3)}***` : undefined,
            passwordLength: password?.length,
            confirmPasswordLength: confirmPassword?.length,
        });

        // Validate input
        if (!email || !password) {
            console.log(`[${requestId}] Missing required fields`);
            return NextResponse.json(
                {
                    error: "Email and password are required",
                    error_code: "MISSING_FIELD",
                    field: !email ? "email" : "password",
                    request_id: requestId
                },
                { status: 400 }
            );
        }

        // Check confirmPassword match BEFORE any processing
        if (confirmPassword && password !== confirmPassword) {
            console.log(`[${requestId}] Password mismatch`);
            return NextResponse.json(
                {
                    error: "Passwords do not match",
                    error_code: "passwords_do_not_match",
                    field: "confirmPassword",
                    request_id: requestId
                },
                { status: 400 }
            );
        }

        // Clean email: trim and lowercase
        email = email.trim().toLowerCase();
        console.log(`[${requestId}] Cleaned email:`, email);

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log(`[${requestId}] Invalid email format`);
            return NextResponse.json(
                {
                    error: "Invalid email format",
                    error_code: "invalid_email",
                    field: "email",
                    request_id: requestId
                },
                { status: 400 }
            );
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        console.log(`[${requestId}] Password validation:`, passwordValidation);

        if (!passwordValidation.isValid) {
            console.log(`[${requestId}] Weak password:`, passwordValidation.errors);
            return NextResponse.json(
                {
                    error: passwordValidation.errors[0],
                    error_code: "password_too_weak",
                    field: "password",
                    details: passwordValidation.errors,
                    request_id: requestId
                },
                { status: 400 }
            );
        }

        // Test database connection first
        console.log(`[${requestId}] Testing database connection...`);
        try {
            await prisma.$queryRaw`SELECT 1`;
            console.log(`[${requestId}] Database connection OK`);
        } catch (dbError: any) {
            console.error(`[${requestId}] DATABASE CONNECTION FAILED:`, {
                message: dbError.message,
                code: dbError.code,
                meta: dbError.meta,
                stack: dbError.stack,
            });
            return NextResponse.json(
                {
                    error: "Database connection failed. Please ensure PostgreSQL is running and migrations are applied.",
                    error_code: "db_connection_failed",
                    request_id: requestId,
                    details: {
                        message: dbError.message,
                        code: dbError.code,
                    }
                },
                { status: 503 }
            );
        }

        // Check if user already exists
        console.log(`[${requestId}] Checking for existing user...`);
        let existingUser;
        try {
            existingUser = await prisma.user.findUnique({
                where: { email },
            });
            console.log(`[${requestId}] Existing user check:`, existingUser ? "found" : "not found");
        } catch (dbError: any) {
            console.error(`[${requestId}] Error checking existing user:`, {
                message: dbError.message,
                code: dbError.code,
                meta: dbError.meta,
            });
            return NextResponse.json(
                {
                    error: "Database query failed",
                    error_code: "db_query_failed",
                    request_id: requestId
                },
                { status: 503 }
            );
        }

        if (existingUser) {
            console.log(`[${requestId}] Email already exists (anti-enumeration response)`);
            // Return generic error to prevent email enumeration
            return NextResponse.json(
                {
                    error: "An account may already exist with this email.",
                    error_code: "email_already_exists",
                    request_id: requestId
                },
                { status: 400 }
            );
        }

        // Hash password
        console.log(`[${requestId}] Hashing password...`);
        const passwordHash = await hashPassword(password);
        console.log(`[${requestId}] Password hashed successfully`);

        // Create user (emailVerified = null)
        console.log(`[${requestId}] Creating user...`);
        let user;
        try {
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    emailVerified: new Date(),
                },
            });
            console.log(`[${requestId}] User created:`, user.id);
        } catch (dbError: any) {
            console.error(`[${requestId}] Error creating user:`, {
                message: dbError.message,
                code: dbError.code,
                meta: dbError.meta,
                stack: dbError.stack,
            });
            return NextResponse.json(
                {
                    error: "Failed to create user account",
                    error_code: "user_creation_failed",
                    request_id: requestId,
                    details: {
                        message: dbError.message,
                        code: dbError.code,
                    }
                },
                { status: 500 }
            );
        }

        // Verification steps skipped for immediate access
        /*
        // Generate verification token
        ...
        // Send verification email
        ...
        */

        const duration = Date.now() - startTime;
        console.log(`[${requestId}] Signup completed successfully in ${duration}ms`);
        console.log("=".repeat(80) + "\n");

        return NextResponse.json(
            {
                message: "Account created successfully.",
                userId: user.id,
                email: user.email,
                emailVerified: true,
                request_id: requestId
            },
            { status: 201 }
        );
    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[${requestId}] UNEXPECTED ERROR after ${duration}ms:`, {
            message: error.message,
            stack: error.stack,
            name: error.name,
        });
        console.log("=".repeat(80) + "\n");

        return NextResponse.json(
            {
                error: "An unexpected error occurred. Please try again.",
                error_code: "internal_error",
                request_id: requestId
            },
            { status: 500 }
        );
    }
}
