/**
 * Badge Triggers - Automated badge award logic
 * 
 * Checks user eligibility for badges and awards them automatically.
 * Focuses on consistency badges as per requirements.
 */

import { prisma } from './prisma';

/**
 * Check and award "first_game" badge (played first game ever)
 * @param userId - User ID
 * @returns true if badge was awarded, false if already had it
 */
async function checkFirstGameBadge(userId: string): Promise<boolean> {
    const badge = await prisma.badge.findUnique({
        where: { code: 'first_game' },
    });

    if (!badge) return false;

    // Check if user already has this badge
    const existingUserBadge = await prisma.userBadge.findUnique({
        where: {
            userId_badgeId: {
                userId,
                badgeId: badge.id,
            },
        },
    });

    if (existingUserBadge) return false;

    // Award the badge
    await prisma.userBadge.create({
        data: {
            userId,
            badgeId: badge.id,
        },
    });

    return true;
}

/**
 * Check and award session milestone badges (sessions_10, sessions_50, sessions_200)
 * @param userId - User ID
 * @returns Array of badge codes that were awarded
 */
async function checkSessionMilestoneBadges(userId: string): Promise<string[]> {
    const awarded: string[] = [];

    // Get total sessions from UserStats
    const userStats = await prisma.userStats.findUnique({
        where: { userId },
        select: { totalSessions: true },
    });

    if (!userStats) return awarded;

    const totalSessions = userStats.totalSessions;

    // Check each milestone
    const milestones = [
        { code: 'sessions_10', threshold: 10 },
        { code: 'sessions_50', threshold: 50 },
        { code: 'sessions_200', threshold: 200 },
    ];

    for (const milestone of milestones) {
        if (totalSessions >= milestone.threshold) {
            const badge = await prisma.badge.findUnique({
                where: { code: milestone.code },
            });

            if (!badge) continue;

            // Check if user already has this badge
            const existingUserBadge = await prisma.userBadge.findUnique({
                where: {
                    userId_badgeId: {
                        userId,
                        badgeId: badge.id,
                    },
                },
            });

            if (!existingUserBadge) {
                await prisma.userBadge.create({
                    data: {
                        userId,
                        badgeId: badge.id,
                    },
                });
                awarded.push(milestone.code);
            }
        }
    }

    return awarded;
}

/**
 * Check and award streak badges (streak_3, streak_7, streak_14)
 * @param userId - User ID
 * @returns Array of badge codes that were awarded
 */
async function checkStreakBadges(userId: string): Promise<string[]> {
    const awarded: string[] = [];

    // Get current streak from UserStats
    const userStats = await prisma.userStats.findUnique({
        where: { userId },
        select: { currentStreak: true },
    });

    if (!userStats) return awarded;

    const currentStreak = userStats.currentStreak;

    // Check each streak milestone
    const streakMilestones = [
        { code: 'streak_3', threshold: 3 },
        { code: 'streak_7', threshold: 7 },
        { code: 'streak_14', threshold: 14 },
    ];

    for (const milestone of streakMilestones) {
        if (currentStreak >= milestone.threshold) {
            const badge = await prisma.badge.findUnique({
                where: { code: milestone.code },
            });

            if (!badge) continue;

            // Check if user already has this badge
            const existingUserBadge = await prisma.userBadge.findUnique({
                where: {
                    userId_badgeId: {
                        userId,
                        badgeId: badge.id,
                    },
                },
            });

            if (!existingUserBadge) {
                await prisma.userBadge.create({
                    data: {
                        userId,
                        badgeId: badge.id,
                    },
                });
                awarded.push(milestone.code);
            }
        }
    }

    return awarded;
}

/**
 * Check and award "tried_all_games" badge (played all 11 active games)
 * @param userId - User ID
 * @returns true if badge was awarded, false if already had it or doesn't qualify
 */
async function checkTriedAllGamesBadge(userId: string): Promise<boolean> {
    const badge = await prisma.badge.findUnique({
        where: { code: 'tried_all_games' },
    });

    if (!badge) return false;

    // Check if user already has this badge
    const existingUserBadge = await prisma.userBadge.findUnique({
        where: {
            userId_badgeId: {
                userId,
                badgeId: badge.id,
            },
        },
    });

    if (existingUserBadge) return false;

    // Get all active games
    const activeGames = await prisma.game.findMany({
        where: { isActive: true },
        select: { slug: true },
    });

    const activeGameSlugs = activeGames.map(g => g.slug);

    // Get unique games the user has played
    const playedGames = await prisma.result.findMany({
        where: { userId },
        select: { gameSlug: true },
        distinct: ['gameSlug'],
    });

    const playedGameSlugs = playedGames.map(g => g.gameSlug);

    // Check if user has played all active games
    const hasPlayedAll = activeGameSlugs.every(slug => playedGameSlugs.includes(slug));

    if (hasPlayedAll) {
        await prisma.userBadge.create({
            data: {
                userId,
                badgeId: badge.id,
            },
        });
        return true;
    }

    return false;
}

/**
 * Check and award "Game Master" badges (100 plays on a game)
 * @param userId - User ID
 * @param gameId - Game ID (optional, optimization to check only played game)
 * @param gameSlug - Game Slug (optional)
 */
async function checkGameMasteryBadges(userId: string, gameSlug: string): Promise<string[]> {
    const awarded: string[] = [];
    // Define mastery badge code
    const badgeCode = `game_master_${gameSlug}`;

    // Check if badge exists in DB
    const badge = await prisma.badge.findUnique({ where: { code: badgeCode } });
    if (!badge) return awarded; // Badge not defined for this game yet

    // Check if valid already
    const existing = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } }
    });
    if (existing) return awarded;

    // Check stats (DailyAggregate count is not enough, need total plays for this game)
    // We can count Results or use UserAggregates if we had per-game aggregates stored efficiently.
    // Result count is safest for now.
    const plays = await prisma.result.count({
        where: { userId, gameSlug }
    });

    if (plays >= 100) {
        await prisma.userBadge.create({
            data: { userId, badgeId: badge.id }
        });
        awarded.push(badgeCode);
    }
    return awarded;
}

/**
 * Check and award all applicable badges for a user
 * Called after a result is saved
 * @param userId - User ID
 * @param gameSlug - Slug of the game just played (for specific optimisation)
 * @param score - Score just achieved
 * @returns Array of newly awarded badge codes
 */
export async function checkAndAwardBadges(userId: string, gameSlug: string, score: number): Promise<string[]> {
    const awarded: string[] = [];

    // Check first game badge
    const firstGameAwarded = await checkFirstGameBadge(userId);
    if (firstGameAwarded) awarded.push('first_game');

    // Check session milestones
    const sessionBadges = await checkSessionMilestoneBadges(userId);
    awarded.push(...sessionBadges);

    // Check streak badges
    const streakBadges = await checkStreakBadges(userId);
    awarded.push(...streakBadges);

    // Check tried all games
    const triedAllAwarded = await checkTriedAllGamesBadge(userId);
    if (triedAllAwarded) awarded.push('tried_all_games');

    // Check Game Mastery (specific to this game)
    const masteryBadges = await checkGameMasteryBadges(userId, gameSlug);
    awarded.push(...masteryBadges);

    return awarded;
}

// Export individual check functions for testing/manual use
export {
    checkFirstGameBadge,
    checkSessionMilestoneBadges,
    checkStreakBadges,
    checkTriedAllGamesBadge,
};
