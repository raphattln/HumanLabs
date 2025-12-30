
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllGames } from "@/lib/game-config";

export async function GET(req: NextRequest) {
    try {
        const games = getAllGames();

        // Fetch latest aggregation for each game
        // We can do this efficiently by fetching all aggs where date = (latest_available)
        // Or simply fetching aggs for TODAY. If empty, maybe yesterday?
        // Simplest strategy: GroupBy gameId and get Max Date? 
        // Or just fetch all aggs ordered by date desc distinct by game.

        // Since we want FAST loading, let's fetch only the most recent entry per game
        // findMany doesn't support distinct on non-unique fields easily with orderBy in all db versions, 
        // but Postgres does distinct on.

        const latestAggs = await prisma.populationAggregate.findMany({
            distinct: ['gameId'],
            orderBy: [
                { gameId: 'asc' },
                { date: 'desc' }
            ],
            include: {
                game: true
            }
        });

        const aggMap = new Map();
        latestAggs.forEach(agg => aggMap.set(agg.game.slug, agg));

        const summary = games.map(game => {
            const agg = aggMap.get(game.slug);

            return {
                gameSlug: game.slug,
                gameName: game.name,
                scoreDirection: game.scoreDirection,
                scoreUnit: game.scoreUnit,
                plays: agg?.plays || 0,
                mean: agg?.mean || 0,
                p50: agg?.p50 || 0,
                p25: agg?.p25 || 0,
                p75: agg?.p75 || 0,
                min: agg?.min || 0,
                max: agg?.max || 0,
                updatedAt: agg?.updatedAt || null,
                hasData: !!agg
            };
        });

        return NextResponse.json(summary);

    } catch (error) {
        console.error("Population Summary Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
