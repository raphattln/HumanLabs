
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

async function getUserId(req: NextRequest): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) return session.user.id;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
        const dbSession = await prisma.session.findUnique({ where: { sessionToken: token } });
        return dbSession?.userId || null;
    }
    return null;
}

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Parallel queries for overview
        const [userStats, badges, recentResults] = await Promise.all([
            prisma.userStats.findUnique({ where: { userId } }),
            prisma.userBadge.findMany({
                where: { userId },
                include: { badge: true },
                orderBy: { earnedAt: 'desc' },
                take: 5
            }),
            prisma.result.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { user: { select: { displayName: true } } } // implicit join check
            })
        ]);

        return NextResponse.json({
            totalPlays: userStats?.totalSessions || 0, // Using totalSessions as proxy or we count results if needed
            bestStreak: userStats?.longestStreak || 0,
            currentStreak: userStats?.currentStreak || 0,
            lastPlayed: userStats?.lastPlayedDate,
            recentBadges: badges.map(ub => ub.badge),
            lastActivity: recentResults[0] ? {
                gameSlug: recentResults[0].gameSlug,
                date: recentResults[0].createdAt
            } : null
        });

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
