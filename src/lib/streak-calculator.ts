/**
 * Streak Calculator - Timezone-aware streak calculation utilities
 * 
 * Handles user streak calculation based on their timezone to ensure
 * accurate consecutive day tracking regardless of UTC offsets.
 */

import { prisma } from './prisma';

/**
 * Get local date string from UTC datetime in user's timezone
 * @param utcDate - UTC datetime
 * @param timezone - IANA timezone (e.g., "America/New_York", "Europe/Paris")
 * @returns "YYYY-MM-DD" string in local timezone
 */
export function getLocalDateKey(utcDate: Date, timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    // en-CA format gives us YYYY-MM-DD
    return formatter.format(utcDate);
}

/**
 * Get unique play dates for a user in their timezone
 * @param userId - User ID
 * @param timezone - IANA timezone
 * @returns Array of unique date strings (YYYY-MM-DD) sorted ascending
 */
async function getUniquePlayDates(userId: string, timezone: string): Promise<string[]> {
    const results = await prisma.result.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
    });

    const uniqueDates = new Set<string>();
    for (const result of results) {
        const dateKey = getLocalDateKey(result.createdAt, timezone);
        uniqueDates.add(dateKey);
    }

    return Array.from(uniqueDates).sort();
}

/**
 * Calculate current streak (consecutive days played up to today)
 * @param playDates - Sorted array of unique play dates (YYYY-MM-DD)
 * @param todayKey - Today's date in user's timezone (YYYY-MM-DD)
 * @returns Current streak count
 */
function calculateCurrentStreak(playDates: string[], todayKey: string): number {
    if (playDates.length === 0) return 0;

    const lastPlayDate = playDates[playDates.length - 1];
    const yesterday = getYesterdayKey(todayKey);

    // Streak is broken if last play was more than 1 day ago
    if (lastPlayDate !== todayKey && lastPlayDate !== yesterday) {
        return 0;
    }

    // Count backwards from last play date
    let streak = 0;
    for (let i = playDates.length - 1; i >= 0; i--) {
        const expectedDate = getDateKeyDaysAgo(lastPlayDate, streak);
        if (playDates[i] === expectedDate) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Calculate longest streak ever
 * @param playDates - Sorted array of unique play dates (YYYY-MM-DD)
 * @returns Longest streak count
 */
function calculateLongestStreak(playDates: string[]): number {
    if (playDates.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < playDates.length; i++) {
        const prevDate = playDates[i - 1];
        const currDate = playDates[i];

        // Check if dates are consecutive
        const nextDay = getNextDayKey(prevDate);
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
 * Get yesterday's date key from a given date key
 * @param dateKey - Date in YYYY-MM-DD format
 * @returns Yesterday's date in YYYY-MM-DD format
 */
function getYesterdayKey(dateKey: string): string {
    const date = new Date(dateKey + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().split('T')[0];
}

/**
 * Get next day's date key from a given date key
 * @param dateKey - Date in YYYY-MM-DD format
 * @returns Next day's date in YYYY-MM-DD format
 */
function getNextDayKey(dateKey: string): string {
    const date = new Date(dateKey + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().split('T')[0];
}

/**
 * Get date key N days ago from a given date key
 * @param dateKey - Date in YYYY-MM-DD format
 * @param daysAgo - Number of days to go back
 * @returns Date N days ago in YYYY-MM-DD format
 */
function getDateKeyDaysAgo(dateKey: string, daysAgo: number): string {
    const date = new Date(dateKey + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

/**
 * Calculate current and longest streak for a user
 * @param userId - User ID
 * @param timezone - IANA timezone string
 * @returns { currentStreak, longestStreak, lastPlayedDate }
 */
export async function calculateStreaks(
    userId: string,
    timezone: string
): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastPlayedDate: string | null;
}> {
    const playDates = await getUniquePlayDates(userId, timezone);

    if (playDates.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastPlayedDate: null,
        };
    }

    const todayKey = getLocalDateKey(new Date(), timezone);
    const currentStreak = calculateCurrentStreak(playDates, todayKey);
    const longestStreak = calculateLongestStreak(playDates);
    const lastPlayedDate = playDates[playDates.length - 1];

    return {
        currentStreak,
        longestStreak,
        lastPlayedDate,
    };
}

/**
 * Update streaks in UserStats after a new result is saved
 * @param userId - User ID
 * @param timezone - IANA timezone string
 * @returns Updated UserStats or null if user doesn't exist
 */
export async function updateStreaksAfterResult(
    userId: string,
    timezone: string
): Promise<void> {
    const streaks = await calculateStreaks(userId, timezone);

    // Upsert UserStats
    await prisma.userStats.upsert({
        where: { userId },
        create: {
            userId,
            currentStreak: streaks.currentStreak,
            longestStreak: streaks.longestStreak,
            lastPlayedDate: streaks.lastPlayedDate,
            totalSessions: 1,
        },
        update: {
            currentStreak: streaks.currentStreak,
            longestStreak: streaks.longestStreak,
            lastPlayedDate: streaks.lastPlayedDate,
            totalSessions: {
                increment: 1,
            },
        },
    });
}
