import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getLocalDateKey } from "@/lib/streak-calculator";
import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";

/**
 * Helper: Get user ID from session or custom cookie
 */
async function getUserId(): Promise<string | null> {
    // 1. Try NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user?.id) return session.user.id;

    // 2. Try Custom Cookie (auth_token) -> Session lookup
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
        const dbSession = await prisma.session.findUnique({
            where: { sessionToken: token },
            select: { userId: true, expires: true }
        });
        if (dbSession && dbSession.expires > new Date()) {
            return dbSession.userId;
        }
    }
    return null;
}

/**
 * Helper: Get unique play dates for a user in their timezone
 * Used within transaction for streak calculation
 */
async function getUniquePlayDates(
    tx: Prisma.TransactionClient,
    userId: string,
    timezone: string
): Promise<string[]> {
    const results = await tx.result.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
    });

    const uniqueDates = new Set<string>();
    for (const result of results) {
        uniqueDates.add(getLocalDateKey(result.createdAt, timezone));
    }
    return Array.from(uniqueDates).sort();
}

/**
 * Helper: Calculate current streak
 * Counts consecutive days played up to today
 */
function calculateCurrentStreak(playDates: string[], todayKey: string): number {
    if (playDates.length === 0) return 0;

    const lastPlayDate = playDates[playDates.length - 1];
    const yesterday = getDateKeyMinusDays(todayKey, 1);

    // Streak is broken if last play was more than 1 day ago
    if (lastPlayDate !== todayKey && lastPlayDate !== yesterday) {
        return 0;
    }

    // Count backwards from last play date
    let streak = 0;
    for (let i = playDates.length - 1; i >= 0; i--) {
        const expectedDate = getDateKeyMinusDays(lastPlayDate, streak);
        if (playDates[i] === expectedDate) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Helper: Calculate longest streak ever
 */
function calculateLongestStreak(playDates: string[]): number {
    if (playDates.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < playDates.length; i++) {
        const prevDate = playDates[i - 1];
        const currDate = playDates[i];
        const nextDay = getDateKeyPlusDays(prevDate, 1);

        if (currDate === nextDay) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }

    return longestStreak;
}

/**
 * Helper: Get date key N days in the future
 */
function getDateKeyPlusDays(dateKey: string, days: number): string {
    const date = new Date(dateKey + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Helper: Get date key N days in the past
 */
function getDateKeyMinusDays(dateKey: string, days: number): string {
    const date = new Date(dateKey + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().split('T')[0];
}

/**
 * Helper: Check and award badges within transaction
 */
async function checkAndAwardBadgesInTransaction(
    tx: Prisma.TransactionClient,
    userId: string
): Promise<string[]> {
    const awarded: string[] = [];

    // Get UserStats for milestone checks
    const userStats = await tx.userStats.findUnique({
        where: { userId },
        select: { totalSessions: true, currentStreak: true },
    });

    if (!userStats) return awarded;

    // Check first game badge
    const firstGameBadge = await tx.badge.findUnique({ where: { code: 'first_game' } });
    if (firstGameBadge && userStats.totalSessions === 1) {
        const existing = await tx.userBadge.findUnique({
            where: { userId_badgeId: { userId, badgeId: firstGameBadge.id } },
        });
        if (!existing) {
            await tx.userBadge.create({ data: { userId, badgeId: firstGameBadge.id } });
            awarded.push('first_game');
        }
    }

    // Check session milestones
    const sessionMilestones = [
        { code: 'sessions_10', threshold: 10 },
        { code: 'sessions_50', threshold: 50 },
        { code: 'sessions_200', threshold: 200 },
    ];

    for (const milestone of sessionMilestones) {
        if (userStats.totalSessions === milestone.threshold) {
            const badge = await tx.badge.findUnique({ where: { code: milestone.code } });
            if (badge) {
                const existing = await tx.userBadge.findUnique({
                    where: { userId_badgeId: { userId, badgeId: badge.id } },
                });
                if (!existing) {
                    await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
                    awarded.push(milestone.code);
                }
            }
        }
    }

    // Check streak milestones
    const streakMilestones = [
        { code: 'streak_3', threshold: 3 },
        { code: 'streak_7', threshold: 7 },
        { code: 'streak_14', threshold: 14 },
    ];

    for (const milestone of streakMilestones) {
        if (userStats.currentStreak === milestone.threshold) {
            const badge = await tx.badge.findUnique({ where: { code: milestone.code } });
            if (badge) {
                const existing = await tx.userBadge.findUnique({
                    where: { userId_badgeId: { userId, badgeId: badge.id } },
                });
                if (!existing) {
                    await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
                    awarded.push(milestone.code);
                }
            }
        }
    }

    // Check "tried all games" badge
    const activeGames = await tx.game.findMany({
        where: { isActive: true },
        select: { slug: true },
    });
    const playedGames = await tx.result.groupBy({
        by: ['gameSlug'],
        where: { userId },
    });

    if (playedGames.length === activeGames.length) {
        const badge = await tx.badge.findUnique({ where: { code: 'tried_all_games' } });
        if (badge) {
            const existing = await tx.userBadge.findUnique({
                where: { userId_badgeId: { userId, badgeId: badge.id } },
            });
            if (!existing) {
                await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
                awarded.push('tried_all_games');
            }
        }
    }

    return awarded;
}

/**
 * POST /api/results
 * Save a game result with atomic transaction for:
 * - Result creation
 * - DailyAggregate update
 * - UserStats update (streaks, sessions)
 * - Badge awards
 */
export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const { gameSlug, score, metadata, deviceInfo } = await req.json();

        if (!gameSlug || score === undefined) {
            return NextResponse.json(
                { message: "Missing game slug or score" },
                { status: 400 }
            );
        }

        let awardedBadges: string[] = [];

        // ATOMIC TRANSACTION: All operations succeed or all fail
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create result
            const newResult = await tx.result.create({
                data: {
                    userId: userId || null,
                    gameSlug,
                    score: parseFloat(score),
                    metadata: metadata || {},
                    deviceInfo: deviceInfo || {},
                },
            });

            // If logged in, update aggregates, streaks, and badges
            if (userId) {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { timezone: true },
                });

                if (user) {
                    // 2. Update/create DailyAggregate
                    const game = await tx.game.findUnique({
                        where: { slug: gameSlug },
                        select: { id: true, scoreDirection: true },
                    });

                    if (game) {
                        // dayKey = user-local day in YYYY-MM-DD format
                        const dayKey = getLocalDateKey(new Date(), user.timezone);

                        const existing = await tx.dailyAggregate.findUnique({
                            where: {
                                userId_gameId_dayKey: {
                                    userId: userId,
                                    gameId: game.id,
                                    dayKey,
                                },
                            },
                        });

                        // Determine if new score is better based on scoreDirection
                        const isNewBest = !existing || (
                            game.scoreDirection === 'HIGHER_BETTER'
                                ? parseFloat(score) > existing.bestScore
                                : parseFloat(score) < existing.bestScore
                        );

                        await tx.dailyAggregate.upsert({
                            where: {
                                userId_gameId_dayKey: {
                                    userId: userId,
                                    gameId: game.id,
                                    dayKey,
                                },
                            },
                            create: {
                                userId: userId,
                                gameId: game.id,
                                dayKey,
                                bestScore: parseFloat(score),
                                attempts: 1,
                            },
                            update: {
                                bestScore: isNewBest ? parseFloat(score) : existing!.bestScore,
                                attempts: { increment: 1 },
                            },
                        });

                        // 3. Recalculate streaks deterministically from DailyAggregates
                        const playDates = await getUniquePlayDates(tx, userId, user.timezone);
                        const todayKey = getLocalDateKey(new Date(), user.timezone);
                        const currentStreak = calculateCurrentStreak(playDates, todayKey);
                        const longestStreak = calculateLongestStreak(playDates);

                        await tx.userStats.upsert({
                            where: { userId: userId },
                            create: {
                                userId: userId,
                                currentStreak,
                                longestStreak,
                                lastPlayedDate: todayKey,
                                totalSessions: 1,
                            },
                            update: {
                                currentStreak,
                                longestStreak,
                                lastPlayedDate: todayKey,
                                totalSessions: { increment: 1 },
                            },
                        });

                        // 4. Check and award badges
                        awardedBadges = await checkAndAwardBadgesInTransaction(tx, userId);
                    }
                }
            }

            return newResult;
        });

        return NextResponse.json(
            {
                message: "Result saved",
                id: result.id,
                awardedBadges: awardedBadges.length > 0 ? awardedBadges : undefined,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Save result error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/results
 * Fetch results with optional filters
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const gameSlug = searchParams.get("gameSlug");
        const limit = parseInt(searchParams.get("limit") || "10");
        const mine = searchParams.get("mine") === "true";

        const query: any = {};
        if (gameSlug) query.gameSlug = gameSlug;

        if (mine) {
            const userId = await getUserId();
            if (!userId) {
                return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
            }
            query.userId = userId;
        }

        // Get game to determine score direction
        let sortOrder: 'asc' | 'desc' = 'desc';
        if (gameSlug) {
            const game = await prisma.game.findUnique({
                where: { slug: gameSlug },
                select: { scoreDirection: true },
            });
            sortOrder = game?.scoreDirection === 'LOWER_BETTER' ? 'asc' : 'desc';
        }

        const results = await prisma.result.findMany({
            where: query,
            orderBy: { score: sortOrder },
            take: limit,
            include: {
                user: {
                    select: {
                        displayName: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error("Fetch results error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
