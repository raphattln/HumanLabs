
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGameConfig } from "@/lib/game-config";

export async function GET(request: NextRequest) {
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
        // We need "Best Score per User".
        // Prisma `groupBy` is perfect for this.
        const aggregations: any = {};
        if (gameConfig.scoreDirection === 'LOWER_BETTER') {
            aggregations._min = { score: true };
        } else {
            aggregations._max = { score: true };
        }

        const leaderboardRaw = await prisma.result.groupBy({
            by: ['userId'],
            where: { gameSlug: slug },
            ...aggregations,
            orderBy: gameConfig.scoreDirection === 'LOWER_BETTER'
                ? { _min: { score: 'asc' } }
                : { _max: { score: 'desc' } },
            take: 50,
        });

        // Now fetch user details for these IDs
        const userIds = leaderboardRaw
            .map(r => r.userId)
            .filter((id): id is string => id !== null); // Valid IDs only

        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, displayName: true, username: true, avatar: true }
        });

        const userMap = new Map(users.map(u => [u.id, u]));

        const leaderboard = leaderboardRaw.map((entry, index) => {
            const user = entry.userId ? userMap.get(entry.userId) : null;
            const score = gameConfig.scoreDirection === 'LOWER_BETTER'
                ? entry._min?.score
                : entry._max?.score;

            return {
                rank: index + 1,
                user: {
                    displayName: user?.displayName || user?.username || 'Anonymous',
                    avatar: user?.avatar
                },
                score: score
            };
        });

        return NextResponse.json({
            game: slug,
            leaderboard
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
