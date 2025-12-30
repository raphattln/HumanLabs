
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { getGameConfig, ScoreDirection } from "@/lib/game-config";

async function getUserId(req: NextRequest): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) return session.user.id;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
        const dbSession = await prisma.session.findUnique({ where: { sessionToken: token } });
        return dbSession?.userId || null;
    }
    return null;
}

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
        return NextResponse.json({ error: "Game slug required" }, { status: 400 });
    }

    const gameConfig = getGameConfig(slug);
    if (!gameConfig) {
        return NextResponse.json({ error: "Invalid game" }, { status: 404 });
    }

    try {
        // 1. Get Best Score
        const aggregations: any = { _count: true, _avg: { score: true } };
        if (gameConfig.scoreDirection === 'LOWER_BETTER') {
            aggregations._min = { score: true };
        } else {
            aggregations._max = { score: true };
        }

        const bestAgg = await prisma.result.aggregate({
            where: { userId, gameSlug: slug },
            ...aggregations
        });

        const bestScore = gameConfig.scoreDirection === 'LOWER_BETTER'
            ? bestAgg._min?.score
            : bestAgg._max?.score;

        // 2. Get Last 30 Days Sparkline (from DailyAggregate)
        // Since we didn't fully implement DailyAggregate robustly in past steps, 
        // let's query Results directly for accuracy in MVP to ensure we have data.
        // Actually, let's use Result grouping if DailyAggregate is empty.
        // But implementation plan said "sparkline last 30 days (DailyAggregate)".
        // Let's try DB query.

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const history = await prisma.result.findMany({
            where: {
                userId,
                gameSlug: slug,
                createdAt: { gte: thirtyDaysAgo }
            },
            orderBy: { createdAt: 'asc' },
            select: { score: true, createdAt: true }
        });

        // 3. Percentile (Approximate)
        // Count how many scores are worse than bestScore
        // This is expensive globally. Let's skip or simple query.
        // Optional in prompt.

        return NextResponse.json({
            bestScore: bestScore || 0,
            averageScore: bestAgg._avg?.score || 0,
            plays: bestAgg._count,
            history: history.map(r => ({
                date: r.createdAt,
                score: r.score
            })),
            units: gameConfig.scoreUnit
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
