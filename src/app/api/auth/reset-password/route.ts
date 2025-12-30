import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword, hashToken } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json(
                { error: "Token and new password are required" },
                { status: 400 }
            );
        }

        // Validate password strength
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                { error: passwordValidation.errors[0] },
                { status: 400 }
            );
        }

        // Hash the incoming token
        const hashedToken = hashToken(token);

        // Find the token in database
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token: hashedToken },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (new Date() > resetToken.expiresAt) {
            await prisma.passwordResetToken.delete({
                where: { id: resetToken.id },
            });

            return NextResponse.json(
                { error: "Token has expired. Please request a new password reset." },
                { status: 400 }
            );
        }

        // Check if token has been used
        if (resetToken.used) {
            return NextResponse.json(
                { error: "This token has already been used. Please request a new password reset." },
                { status: 400 }
            );
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update user password
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash },
        });

        // Mark token as used (don't delete, keep for audit trail)
        await prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { used: true },
        });

        return NextResponse.json(
            { message: "Password updated successfully! You can now log in with your new password." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
