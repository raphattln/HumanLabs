import { prisma } from "@/lib/prisma";

/**
 * Check all badge criteria for a user and return newly earned badges
 * Simplified to 8 consistency-based badges only
 */
export async function checkBadges(userId: string): Promise<any[]> {
    // Get user's existing badges
    const existingBadges = await prisma.userBadge.findMany({
        where: { userId },
        select: { badge: { select: { code: true } } },
    });

    const earnedBadgeCodes = new Set(
        existingBadges.map((ub) => ub.badge.code)
    );

    // Get user data
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            currentStreak: true,
            longestStreak: true,
        },
    });

    if (!user) return [];

    // Get user's results
    const results = await prisma.result.findMany({
        where: { userId },
        select: {
            gameSlug: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const totalSessions = results.length;
    const uniqueGames = new Set(results.map((r) => r.gameSlug));
    const uniqueGameCount = uniqueGames.size;

    // Define badge criteria (8 badges)
    const criteria: Record<string, boolean> = {
        first_game: totalSessions >= 1,
        sessions_10: totalSessions >= 10,
        sessions_50: totalSessions >= 50,
        sessions_200: totalSessions >= 200,
        streak_3: user.currentStreak >= 3 || user.longestStreak >= 3,
        streak_7: user.currentStreak >= 7 || user.longestStreak >= 7,
        streak_14: user.currentStreak >= 14 || user.longestStreak >= 14,
        tried_all_games: uniqueGameCount >= 11,
    };

    // Find newly earned badges
    const newlyEarnedCodes: string[] = [];

    for (const [code, earned] of Object.entries(criteria)) {
        if (earned && !earnedBadgeCodes.has(code)) {
            newlyEarnedCodes.push(code);
        }
    }

    if (newlyEarnedCodes.length === 0) {
        return [];
    }

    // Get badge details and award them
    const badges = await prisma.badge.findMany({
        where: {
            code: { in: newlyEarnedCodes },
        },
    });

    const newBadges = [];

    for (const badge of badges) {
        const userBadge = await prisma.userBadge.create({
            data: {
                userId,
                badgeId: badge.id,
            },
            include: {
                badge: true,
            },
        });

        newBadges.push(userBadge.badge);
    }

    return newBadges;
}
