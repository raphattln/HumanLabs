import { prisma } from "@/lib/prisma";

/**
 * Convert a date to the start of day in a specific timezone
 */
function toLocalDayStart(date: Date, timezone: string): Date {
    const dateStr = date.toLocaleString("en-US", { timeZone: timezone });
    const localDate = new Date(dateStr);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
}

/**
 * Get the day key (YYYY-MM-DD) in user's timezone
 */
function getDayKey(date: Date, timezone: string): string {
    return date.toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD format
}

/**
 * Calculate streak from an array of play dates using user's timezone
 */
export function calculateStreaksFromDates(
    playDates: Date[],
    timezone: string
): {
    currentStreak: number;
    longestStreak: number;
} {
    if (playDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // Convert all dates to day keys in user's timezone
    const dayKeys = playDates
        .map((d) => getDayKey(d, timezone))
        .filter((key, index, arr) => arr.indexOf(key) === index) // unique days
        .sort()
        .reverse(); // newest first

    const today = getDayKey(new Date(), timezone);
    const yesterday = getDayKey(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        timezone
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak (from today/yesterday backwards)
    if (dayKeys.length > 0) {
        const mostRecentDay = dayKeys[0];

        if (mostRecentDay === today || mostRecentDay === yesterday) {
            let expectedDay = mostRecentDay;

            for (const dayKey of dayKeys) {
                if (dayKey === expectedDay) {
                    currentStreak++;

                    // Move to previous day
                    const prevDate = new Date(expectedDay);
                    prevDate.setDate(prevDate.getDate() - 1);
                    expectedDay = getDayKey(prevDate, timezone);
                } else {
                    break;
                }
            }
        }
    }

    // Calculate longest streak
    if (dayKeys.length > 0) {
        tempStreak = 1;

        for (let i = 1; i < dayKeys.length; i++) {
            const currentDay = new Date(dayKeys[i - 1]);
            const prevDay = new Date(dayKeys[i]);

            const dayDiff = Math.round(
                (currentDay.getTime() - prevDay.getTime()) / (24 * 60 * 60 * 1000)
            );

            if (dayDiff === 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak };
}

/**
 * Get all unique play dates for a user
 */
export async function getUserPlayDates(userId: string): Promise<Date[]> {
    const results = await prisma.result.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
    });

    return results.map((r) => r.createdAt);
}

/**
 * Calculate and update user streaks using their timezone
 */
export async function updateUserStreaks(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
    });

    const timezone = user?.timezone || "UTC";
    const playDates = await getUserPlayDates(userId);
    const { currentStreak, longestStreak } = calculateStreaksFromDates(
        playDates,
        timezone
    );

    await prisma.user.update({
        where: { id: userId },
        data: {
            currentStreak,
            longestStreak,
            lastPlayedAt: playDates[0] || null,
        },
    });

    return { currentStreak, longestStreak };
}

/**
 * Check if user played today (in their timezone)
 */
export async function didUserPlayToday(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
    });

    const timezone = user?.timezone || "UTC";
    const today = getDayKey(new Date(), timezone);

    const results = await prisma.result.findMany({
        where: { userId },
        select: { createdAt: true },
    });

    return results.some((r) => getDayKey(r.createdAt, timezone) === today);
}

/**
 * Get unique play days count
 */
export async function getUniquePlayDaysCount(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
    });

    const timezone = user?.timezone || "UTC";
    const playDates = await getUserPlayDates(userId);

    const uniqueDays = new Set(
        playDates.map((d) => getDayKey(d, timezone))
    );

    return uniqueDays.size;
}
