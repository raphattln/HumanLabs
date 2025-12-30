import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

        // Get all badges
        const allBadges = await prisma.badge.findMany({
            orderBy: [{ category: "asc" }, { code: "asc" }],
        });

        // Get user's earned badges
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: user.id },
            include: { badge: true },
            orderBy: { earnedAt: "desc" },
        });

        const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

        // Separate earned and locked badges
        const earnedBadges = userBadges.map((ub) => ({
            ...ub.badge,
            earnedAt: ub.earnedAt,
        }));

        const lockedBadges = allBadges.filter(
            (badge) => !earnedBadgeIds.has(badge.id)
        );

        return NextResponse.json({
            earnedBadges,
            lockedBadges,
            totalBadges: allBadges.length,
            earnedCount: earnedBadges.length,
        });
    } catch (error) {
        console.error("Account badges error:", error);
        return NextResponse.json(
            { error: "Failed to fetch badges" },
            { status: 500 }
        );
    }
}
