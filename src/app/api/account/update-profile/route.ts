import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const VALID_AVATAR_PACKS = ["brain", "emoji", "abstract"];

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { username, avatar, timezone } = body;

        const updateData: any = {};

        // Validate and update username
        if (username !== undefined) {
            if (username && username.length < 3) {
                return NextResponse.json(
                    { error: "Username must be at least 3 characters" },
                    { status: 400 }
                );
            }

            if (username && username.length > 20) {
                return NextResponse.json(
                    { error: "Username must be at most 20 characters" },
                    { status: 400 }
                );
            }

            if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
                return NextResponse.json(
                    { error: "Username can only contain letters, numbers, hyphens, and underscores" },
                    { status: 400 }
                );
            }

            // Check if username is taken
            if (username) {
                const existingUser = await prisma.user.findUnique({
                    where: { username },
                });

                if (existingUser && existingUser.id !== user.id) {
                    return NextResponse.json(
                        { error: "Username is already taken" },
                        { status: 400 }
                    );
                }
            }

            updateData.username = username || null;
        }

        // Validate and update avatar
        if (avatar !== undefined) {
            if (avatar && typeof avatar === "object") {
                // Validate avatar structure: { pack, id }
                if (!avatar.pack || !avatar.id) {
                    return NextResponse.json(
                        { error: "Avatar must have pack and id" },
                        { status: 400 }
                    );
                }

                if (!VALID_AVATAR_PACKS.includes(avatar.pack)) {
                    return NextResponse.json(
                        { error: "Invalid avatar pack" },
                        { status: 400 }
                    );
                }

                updateData.avatar = avatar;
            } else if (avatar === null) {
                updateData.avatar = null;
            }
        }

        // Validate and update timezone
        if (timezone !== undefined) {
            // Basic IANA timezone validation
            try {
                Intl.DateTimeFormat(undefined, { timeZone: timezone });
                updateData.timezone = timezone;
            } catch (err) {
                return NextResponse.json(
                    { error: "Invalid timezone" },
                    { status: 400 }
                );
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                username: true,
                avatar: true,
                timezone: true,
            },
        });

        return NextResponse.json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
