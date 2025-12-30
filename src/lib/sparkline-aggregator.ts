/**
 * Sparkline Aggregator - Efficient sparkline data generation
 * 
 * Generates up to 10 data points for sparkline charts using DailyAggregate
 * for optimal performance.
 */

import { prisma } from './prisma';
import { getLocalDateKey } from './streak-calculator';

interface SparklinePoint {
    date: string;
    score: number;
}

/**
 * Generate sparkline data (max 10 points) for a game
 * Uses DailyAggregate for performance if available, falls back to Results
 * @param userId - User ID
 * @param gameSlug - Game slug
 * @param timezone - IANA timezone
 * @returns Array of up to 10 sparkline points (oldest to newest)
 */
export async function getSparklineData(
    userId: string,
    gameSlug: string,
    timezone: string
): Promise<SparklinePoint[]> {
    // Get game ID from slug
    const game = await prisma.game.findUnique({
        where: { slug: gameSlug },
        select: { id: true },
    });

    if (!game) {
        // Fallback if game not found in DB (shouldn't happen)
        return getSparklineFromResults(userId, gameSlug, timezone);
    }

    // Try to get from DailyAggregate first
    const aggregates = await prisma.dailyAggregate.findMany({
        where: {
            userId,
            gameId: game.id,
        },
        orderBy: {
            dayKey: 'desc',
        },
        take: 10,
    });

    if (aggregates.length > 0) {
        // Return aggregates in chronological order (oldest first)
        return aggregates
            .reverse()
            .map(agg => ({
                date: agg.dayKey,
                score: agg.bestScore,
            }));
    }

    // Fallback to Results if no aggregates exist yet
    return getSparklineFromResults(userId, gameSlug, timezone);
}

/**
 * Fallback: Generate sparkline from Results table
 * Groups by day and takes best score per day
 * @param userId - User ID
 * @param gameSlug - Game slug
 * @param timezone - IANA timezone
 * @returns Array of up to 10 sparkline points
 */
async function getSparklineFromResults(
    userId: string,
    gameSlug: string,
    timezone: string
): Promise<SparklinePoint[]> {
    // Get recent results (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const results = await prisma.result.findMany({
        where: {
            userId,
            gameSlug,
            createdAt: {
                gte: thirtyDaysAgo,
            },
        },
        select: {
            score: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'asc',
        },
    });

    if (results.length === 0) return [];

    // Get game scoreDirection to determine best score logic
    const game = await prisma.game.findUnique({
        where: { slug: gameSlug },
        select: { scoreDirection: true },
    });

    const scoreDirection = game?.scoreDirection || 'HIGHER_BETTER';

    // Group by day and get best score per day
    const dayScores = new Map<string, number>();

    for (const result of results) {
        const dayKey = getLocalDateKey(result.createdAt, timezone);
        const existingScore = dayScores.get(dayKey);

        if (!existingScore) {
            dayScores.set(dayKey, result.score);
        } else {
            // Update if this score is better
            const isBetter = scoreDirection === 'HIGHER_BETTER'
                ? result.score > existingScore
                : result.score < existingScore;

            if (isBetter) {
                dayScores.set(dayKey, result.score);
            }
        }
    }

    // Convert to array and sort by date
    const sparklineData = Array.from(dayScores.entries())
        .map(([date, score]) => ({ date, score }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Take last 10 points
    return sparklineData.slice(-10);
}

/**
 * Update or create DailyAggregate for a new result
 * Called when a result is saved to maintain aggregates
 * @param userId - User ID
 * @param gameSlug - Game slug
 * @param score - The new score
 * @param timezone - IANA timezone
 */
export async function updateDailyAggregate(
    userId: string,
    gameSlug: string,
    score: number,
    timezone: string
): Promise<void> {
    // Get game
    const game = await prisma.game.findUnique({
        where: { slug: gameSlug },
        select: { id: true, scoreDirection: true },
    });

    if (!game) return;

    const today = getLocalDateKey(new Date(), timezone);

    // Check if aggregate exists for today
    const existing = await prisma.dailyAggregate.findUnique({
        where: {
            userId_gameId_dayKey: {
                userId,
                gameId: game.id,
                dayKey: today,
            },
        },
    });

    if (!existing) {
        // Create new aggregate
        await prisma.dailyAggregate.create({
            data: {
                userId,
                gameId: game.id,
                dayKey: today,
                bestScore: score,
                attempts: 1,
            },
        });
    } else {
        // Update existing aggregate
        const isNewBest = game.scoreDirection === 'HIGHER_BETTER'
            ? score > existing.bestScore
            : score < existing.bestScore;

        await prisma.dailyAggregate.update({
            where: {
                userId_gameId_dayKey: {
                    userId,
                    gameId: game.id,
                    dayKey: today,
                },
            },
            data: {
                bestScore: isNewBest ? score : existing.bestScore,
                attempts: {
                    increment: 1,
                },
            },
        });
    }
}
