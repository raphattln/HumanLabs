/**
 * Subscription Helper - Derive Pro status from Subscription table
 * 
 * DO NOT store isPro as a boolean field.
 * Pro access must be derived from subscription status + currentPeriodEnd.
 */

import { prisma } from './prisma';

/**
 * Check if a user has active Pro subscription
 * 
 * Pro status is derived from:
 * - subscription.status === 'active' OR 'trialing'
 * - subscription.currentPeriodEnd > now (not expired)
 * 
 * @param userId - User ID
 * @returns true if user has active Pro subscription
 */
export async function isUserPro(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: {
            status: true,
            currentPeriodEnd: true,
        },
    });

    if (!subscription) {
        return false;
    }

    // Check status
    const validStatuses = ['active', 'trialing'];
    if (!validStatuses.includes(subscription.status)) {
        return false;
    }

    // Check not expired
    const now = new Date();
    if (subscription.currentPeriodEnd < now) {
        return false;
    }

    return true;
}

/**
 * Get Pro status for multiple users (bulk query)
 * Useful for leaderboards or user lists
 * 
 * @param userIds - Array of user IDs
 * @returns Map of userId => isPro boolean
 */
export async function getBulkProStatus(
    userIds: string[]
): Promise<Map<string, boolean>> {
    const subscriptions = await prisma.subscription.findMany({
        where: {
            userId: { in: userIds },
            status: { in: ['active', 'trialing'] },
            currentPeriodEnd: { gt: new Date() },
        },
        select: { userId: true },
    });

    const proUserIds = new Set(subscriptions.map(s => s.userId));

    const result = new Map<string, boolean>();
    for (const userId of userIds) {
        result.set(userId, proUserIds.has(userId));
    }

    return result;
}

/**
 * Example usage in API routes:
 * 
 * ```typescript
 * import { isUserPro } from '@/lib/subscription-helper';
 * 
 * export async function GET(req: Request) {
 *   const session = await getServerSession(authOptions);
 *   const isPro = await isUserPro(session.user.id);
 *   
 *   if (!isPro) {
 *     return NextResponse.json({ error: 'Pro feature' }, { status: 403 });
 *   }
 *   
 *   // ... Pro feature logic
 * }
 * ```
 */
