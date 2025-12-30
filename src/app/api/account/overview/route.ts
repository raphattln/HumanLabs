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
            select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                email: true,
                currentStreak: true,
                longestStreak: true,
                lastPlayedAt: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Get total sessions
        const totalSessions = await prisma.result.count({
            where: { userId: user.id },
        });

        // Get unique play days
        const results = await prisma.result.findMany({
            where: { userId: user.id },
            select: { createdAt: true },
        });

        const uniqueDays = new Set(
            results.map((r) => r.createdAt.toDateString())
        ).size;

        // Get top 3 best scores across all games
        const allResults = await prisma.result.findMany({
            where: { userId: user.id },
            orderBy: { score: "desc" },
            take: 3,
            select: {
                gameSlug: true,
                score: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                email: user.email,
                memberSince: user.createdAt,
            },
            stats: {
                totalSessions,
                uniquePlayDays: uniqueDays,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                lastPlayedAt: user.lastPlayedAt,
            },
            topScores: allResults,
        });
    } catch (error) {
        console.error("Account overview error:", error);
        return NextResponse.json(
            { error: "Failed to fetch account overview" },
            { status: 500 }
        );
    }
}
