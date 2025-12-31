
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { getAllGames, GameConfig } from "@/lib/game-config";
import { getToken } from "next-auth/jwt";

async function getUserId(req: NextRequest): Promise<string | null> {
    // 1. Try getServerSession (standard)
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            return session.user.id;
        }
    } catch (e) {
        console.warn("getServerSession failed:", e);
    }

    // 2. Try raw JWT token decode (fallback for some environments)
    try {
        // getToken expects 'req' to have headers/cookies. NextRequest is compatible.
        const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
        if (token?.id) return token.id as string;
        if (token?.sub) return token.sub as string;
    } catch (e) {
        console.warn("getToken failed:", e);
    }

    return null;
}

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);

    if (!userId) {
        console.error("Unauthorized access attempt to /api/performance/summary - Session not found");
        return NextResponse.json({ error: "Unauthorized: Please log in again" }, { status: 401 });
    }

    try {
        const allGames = getAllGames();

        // 1. Fetch Aggregates (Best Score)
        // GroupBy gives us _min and _max for scores per game
        const aggregates = await prisma.result.groupBy({
            by: ['gameSlug'],
            where: { userId },
            _count: { _all: true },
            _min: { score: true },
            _max: { score: true, createdAt: true }, // Max createdAt = last played
        });

        const aggMap = new Map();
        aggregates.forEach(agg => {
            aggMap.set(agg.gameSlug, agg);
        });

        // 2. Fetch Recent History for Sparklines (Optional but requested for Charts)
        // Fetching last 20 results per game is expensive if we do N queries.
        // Optimization: Fetch ALL results for user (assuming < 10k, usually fine for MVP profile) 
        // OR fetch last 20 * N_GAMES with a complex query (difficult in Prisma).
        // Let's fetch all results for this user, selecting only minimal fields, sorted by date.
        // We limit to e.g. 1000 most recent globally to construct recent sparklines.
        const recentResults = await prisma.result.findMany({
            where: { userId },
            select: { gameSlug: true, score: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 200, // Enough to cover ~20 recent plays for 10 games
        });

        // Build summary per game
        const summary = allGames.map(game => {
            const agg = aggMap.get(game.slug);
            const plays = agg?._count._all || 0;
            const lastPlayedAt = agg?._max.createdAt || null;

            // Determine Best
            let best = null;
            if (plays > 0) {
                best = game.scoreDirection === 'LOWER_BETTER'
                    ? agg._min.score
                    : agg._max.score;
            }

            // Extract history for this game from recent results (client needs chronological)
            // Filter then reverse (since we fetched DESC)
            const history = recentResults
                .filter(r => r.gameSlug === game.slug)
                .map(r => r.score)
                .reverse(); // Now ASC time

            return {
                gameSlug: game.slug,
                name: game.name,
                best,
                plays,
                lastPlayedAt,
                recentScores: history,
                higherIsBetter: game.scoreDirection === 'HIGHER_BETTER',
                unit: game.scoreUnit
            };
        });

        return NextResponse.json(summary);

    } catch (error) {
        console.error("Performance Summary Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
