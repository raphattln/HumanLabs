import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        // Hash the incoming token
        const hashedToken = hashToken(token);

        // Find the token in database
        const verificationToken = await prisma.emailVerificationToken.findUnique({
            where: { token: hashedToken },
            include: { user: true },
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (new Date() > verificationToken.expiresAt) {
            // Delete expired token
            await prisma.emailVerificationToken.delete({
                where: { id: verificationToken.id },
            });

            return NextResponse.json(
                { error: "Token has expired. Please request a new verification email." },
                { status: 400 }
            );
        }

        // Token is valid - verify the user's email
        await prisma.user.update({
            where: { id: verificationToken.userId },
            data: { emailVerified: new Date() },
        });

        // Delete the used token
        await prisma.emailVerificationToken.delete({
            where: { id: verificationToken.id },
        });

        return NextResponse.json(
            { message: "Email verified successfully! You can now log in." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
