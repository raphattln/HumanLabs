import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { checkBadges } from "@/lib/badge-utils";
import { updateUserStreaks } from "@/lib/streak-utils";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { newBadges: [] },
                { status: 200 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json(
                { newBadges: [] },
                { status: 200 }
            );
        }

        // Update streaks first
        await updateUserStreaks(user.id);

        // Check for newly earned badges
        const newBadges = await checkBadges(user.id);

        return NextResponse.json({
            newBadges,
            count: newBadges.length,
        });
    } catch (error) {
        console.error("Badge check error:", error);
        return NextResponse.json(
            { error: "Failed to check badges", newBadges: [] },
            { status: 500 }
        );
    }
}
