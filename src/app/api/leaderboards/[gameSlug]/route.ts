import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface LeaderboardParams {
    params: Promise<{
        gameSlug: string;
    }>;
}

/**
 * GET /api/leaderboards/[gameSlug]
 * 
 * Returns best score per user for a specific game with pagination.
 * 
 * CORRECTNESS GUARANTEES:
 * - One entry per user (userId, not null)
 * - Best score respects game's scoreDirection
 * - Indexed query for performance (< 100ms)
 */
export async function GET(
    request: NextRequest,
    props: LeaderboardParams
) {
    try {
        const params = await props.params;
        const { gameSlug } = params;
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
        const skip = (page - 1) * limit;

        // Get game to determine score direction
        const game = await prisma.game.findUnique({
            where: { slug: gameSlug },
            select: { scoreDirection: true, name: true, scoreUnit: true },
        });

        if (!game) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }

        // CORRECTNESS: Respect scoreDirection
        const scoreDirection = game.scoreDirection;
        const sqlSortOrder = scoreDirection === 'HIGHER_BETTER' ? 'DESC' : 'ASC';

        // CORRECTNESS: Get best score per user using DISTINCT ON
        // This ensures exactly one entry per user
        // Excludes null userId (anonymous players)
        const leaderboardResults = await prisma.$queryRaw<Array<{
            userId: string;
            score: number;
            createdAt: Date;
            displayName: string | null;
            avatar: any;
            image: string | null;
        }>>`
            WITH BestScores AS (
                SELECT DISTINCT ON ("userId")
                    "userId",
                    score,
                    "createdAt"
                FROM "Result"
                WHERE "gameSlug" = ${gameSlug}
                  AND "userId" IS NOT NULL
                ORDER BY 
                    "userId",
                    score ${scoreDirection === 'HIGHER_BETTER' ? 'DESC' : 'ASC'},
                    "createdAt" DESC
            )
            SELECT 
                bs."userId",
                bs.score,
                bs."createdAt",
                u."displayName",
                u.avatar,
                u.image
            FROM BestScores bs
            JOIN "User" u ON u.id = bs."userId"
            ORDER BY score ${sqlSortOrder}
            LIMIT ${limit}
            OFFSET ${skip}
        ` as any;

        // Get total unique users for pagination
        const totalUsers = await prisma.result.groupBy({
            by: ['userId'],
            where: {
                gameSlug,
                userId: { not: null },
            },
        });

        const total = totalUsers.length;
        const hasMore = skip + leaderboardResults.length < total;

        // Add rank to results
        const leaderboard = leaderboardResults.map((result: any, index: number) => ({
            rank: skip + index + 1,
            userId: result.userId,
            displayName: result.displayName || 'Anonymous',
            avatar: result.avatar,
            image: result.image,
            score: result.score,
            createdAt: result.createdAt,
        }));

        return NextResponse.json({
            game: {
                slug: gameSlug,
                name: game.name,
                scoreUnit: game.scoreUnit,
                scoreDirection: game.scoreDirection,
            },
            leaderboard,
            pagination: {
                page,
                limit,
                total,
                hasMore,
            },
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
