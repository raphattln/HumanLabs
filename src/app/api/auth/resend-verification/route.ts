import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Always return success to prevent email enumeration
        const genericResponse = NextResponse.json(
            { message: "If an account exists with this email, a verification link has been sent." },
            { status: 200 }
        );

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // If user doesn't exist or is already verified, still return success
        if (!user || user.emailVerified) {
            return genericResponse;
        }

        // Delete any existing verification tokens for this user
        await prisma.emailVerificationToken.deleteMany({
            where: { userId: user.id },
        });

        // Generate new token
        const token = generateToken();
        const hashedToken = hashToken(token);

        // Store hashed token with 24h expiration
        await prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Send verification email
        await sendVerificationEmail(email, token);

        return genericResponse;
    } catch (error) {
        console.error("Resend verification error:", error);
        // Still return success to prevent enumeration
        return NextResponse.json(
            { message: "If an account exists with this email, a verification link has been sent." },
            { status: 200 }
        );
    }
}
