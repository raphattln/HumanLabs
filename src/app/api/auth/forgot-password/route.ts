import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth-utils";
import { sendPasswordResetEmail } from "@/lib/email";

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
            { message: "If an account exists with this email, a password reset link has been sent." },
            { status: 200 }
        );

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // If user doesn't exist, still return success
        if (!user) {
            return genericResponse;
        }

        // Delete any existing reset tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });

        // Generate reset token
        const token = generateToken();
        const hashedToken = hashToken(token);

        // Store hashed token with 15min expiration
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
                used: false,
            },
        });

        // Send reset email
        await sendPasswordResetEmail(email, token);

        return genericResponse;
    } catch (error) {
        console.error("Forgot password error:", error);
        // Still return success to prevent enumeration
        return NextResponse.json(
            { message: "If an account exists with this email, a password reset link has been sent." },
            { status: 200 }
        );
    }
}
