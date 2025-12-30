import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getAllGames, getBestScore } from "@/lib/game-config";

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
            select: { id: true, timezone: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const games = getAllGames();
        const gameProgress = [];

        for (const game of games) {
            // Get all results for this game
            const allResults = await prisma.result.findMany({
                where: {
                    userId: user.id,
                    gameSlug: game.slug,
                },
                select: { score: true, createdAt: true },
                orderBy: { createdAt: "desc" },
            });

            if (allResults.length === 0) {
                // User hasn't played this game
                gameProgress.push({
                    gameSlug: game.slug,
                    gameName: game.name,
                    scoreDirection: game.scoreDirection,
                    scoreUnit: game.scoreUnit,
                    bestEver: null,
                    best7Days: null,
                    best30Days: null,
                    sparklineData: [],
                    attemptCount: 0,
                });
                continue;
            }

            // Best score ever
            const allScores = allResults.map((r) => r.score);
            const bestEver = getBestScore(allScores, game.scoreDirection);

            // Best score last 7 days
            const scores7Days = allResults
                .filter((r) => r.createdAt >= sevenDaysAgo)
                .map((r) => r.score);
            const best7Days = getBestScore(scores7Days, game.scoreDirection);

            // Best score last 30 days
            const scores30Days = allResults
                .filter((r) => r.createdAt >= thirtyDaysAgo)
                .map((r) => r.score);
            const best30Days = getBestScore(scores30Days, game.scoreDirection);

            // Sparkline data: limited to last 14 days or last 10 attempts, whichever is smaller
            const sparklineResults = allResults
                .filter((r) => r.createdAt >= fourteenDaysAgo)
                .slice(0, 10)
                .reverse(); // oldest first for chart

            gameProgress.push({
                gameSlug: game.slug,
                gameName: game.name,
                scoreDirection: game.scoreDirection,
                scoreUnit: game.scoreUnit,
                bestEver,
                best7Days,
                best30Days,
                sparklineData: sparklineResults.map((r) => ({
                    score: r.score,
                    date: r.createdAt,
                })),
                attemptCount: allResults.length,
            });
        }

        return NextResponse.json({ gameProgress });
    } catch (error) {
        console.error("Account progress error:", error);
        return NextResponse.json(
            { error: "Failed to fetch account progress" },
            { status: 500 }
        );
    }
}
