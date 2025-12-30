
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllGames } from "@/lib/game-config";

// Calculate percentiles
function getPercentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (upper === lower) return sorted[index];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export async function POST(req: NextRequest) {
    // 1. Secret Check
    const secret = req.headers.get("x-admin-secret");
    const envSecret = process.env.ADMIN_SECRET || "temp_dev_secret";

    // Allow development bypass if secret not set, otherwise enforce strict check
    if (secret !== envSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const games = getAllGames();
        const date = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        const results = [];

        for (const game of games) {
            // Fetch all scores for this game
            // TODO: For deeper production, use raw SQL for efficient PERCENTILE_CONT
            // But for MVP and <100k scores, loading into memory is acceptable and safer via Prisma
            const dbGame = await prisma.game.findUnique({ where: { slug: game.slug } });

            if (!dbGame) continue;

            const allScores = await prisma.result.findMany({
                where: { gameSlug: game.slug },
                select: { score: true }
            });

            const values = allScores.map(r => r.score);
            const count = values.length;

            if (count > 0) {
                // Calculate Stats
                const min = Math.min(...values);
                const max = Math.max(...values);
                const sum = values.reduce((acc, v) => acc + v, 0);
                const mean = sum / count;
                const p50 = getPercentile(values, 50);
                const p25 = getPercentile(values, 25);
                const p75 = getPercentile(values, 75);

                // Upsert Aggregation
                const agg = await prisma.populationAggregate.upsert({
                    where: {
                        gameId_date: {
                            gameId: dbGame.id,
                            date: date
                        }
                    },
                    update: {
                        plays: count,
                        mean,
                        p50,
                        p25,
                        p75,
                        min,
                        max,
                        updatedAt: new Date()
                    },
                    create: {
                        gameId: dbGame.id,
                        date: date,
                        plays: count,
                        mean,
                        p50,
                        p25,
                        p75,
                        min,
                        max
                    }
                });

                results.push({ game: game.slug, stats: agg });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, results });

    } catch (error) {
        console.error("Recompute Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
