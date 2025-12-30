# Database Architecture Implementation - Migration Guide

## ✅ Completed

### 1. Prisma Schema Updates
- ✅ Added `Game` model with `ScoreDirection` enum
- ✅ Added `DailyAggregate` model for performance optimization  
- ✅ Added `UserStats` model for cached statistics
- ✅ Added `Subscription` model with `SubscriptionStatus` enum
- ✅ Updated `User` model with new relations
- ✅ All required indexes added

**File:** [`prisma/schema.prisma`](file:///Users/raphaattlan/Desktop/humanbenchmark/prisma/schema.prisma)

### 2. Seed Scripts
- ✅ Created `prisma/seed-games.ts` - Seeds all 11 games with scoreDirection
- ✅ Created `prisma/seed.ts` - Master seed script (games + badges)
- ✅ Existing `prisma/seed-badges.ts` already matches requirements

### 3. Server Utilities
- ✅ Created `src/lib/streak-calculator.ts` - Timezone-aware streak calculation
- ✅ Created `src/lib/badge-triggers.ts` - Automated badge award system
- ✅ Created `src/lib/sparkline-aggregator.ts` - Efficient sparkline data generation

### 4. API Routes
- ✅ Enhanced `POST /api/results` - Auto-updates aggregates, streaks, badges
- ✅ Created `GET /api/leaderboards/[gameSlug]` - Paginated leaderboards

### 5. Documentation
- ✅ Implementation plan approved
- ✅ Task breakdown created

---

## ⚠️ Required: Database Migration Steps

**The Prisma schema has been updated but the database needs to be migrated.**

### Prerequisites
1. **Database must be running** on `localhost:5432` (PostgreSQL)
2. **DATABASE_URL** environment variable must be configured in `.env`

### Migration Commands

```bash
# 1. Generate Prisma Client (includes new models/enums)
npx prisma generate

# 2. Create and apply migration
npx prisma migrate dev --name add_complete_db_architecture

# 3. Seed the database
npx tsx prisma/seed.ts
```

### What the Migration Will Do

**New Tables Created:**
- `Game` - Stores all game configurations with scoreDirection
- `DailyAggregate` - Stores daily best scores for performance
- `UserStats` - Stores cached user statistics (streaks, sessions)
- `Subscription` - Stores user subscription data

**New Enums:**
- `ScoreDirection` (HIGHER_BETTER, LOWER_BETTER)
- `SubscriptionStatus` (active, trialing, past_due, canceled, incomplete)

**User Table Updates:**
- Added relations: `dailyAggregates`, `stats`, `subscription`
- No data loss - existing fields preserved

**Indexes Added:**
- Game: `[slug]`, `[isActive]`
- DailyAggregate: `[userId, gameId, dayKey]` (unique), `[userId, gameId]`, `[gameId, dayKey]`
- UserStats: `[userId]`
- Subscription: `[userId]`, `[status]`

---

## 🔧 Current TypeScript Errors

All TypeScript errors are **expected** and will be resolved after running:

```bash
npx prisma generate
```

This regenerates the Prisma Client with the new models, making TypeScript aware of:
- `prisma.game`
- `prisma.dailyAggregate`
- `prisma.userStats`
- `prisma.subscription`
- `ScoreDirection` enum
- `SubscriptionStatus` enum

---

## 📋 Testing Checklist

After migration, test the following:

### 1. Game Results Flow
```bash
# Play a game → Save result → Check response
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{"gameSlug": "reaction-time", "score": 250, "metadata": {}}'
```

**Expected:** Result saved + badges awarded if applicable

### 2. Streak Calculation
- Play games on consecutive days
- Verify `UserStats.currentStreak` increments
- Skip a day → Verify streak resets

### 3. Badge Awards
- First result → "first_game" badge
- 10th result → "sessions_10" badge
- 3 consecutive days → "streak_3" badge
- All 11 games → "tried_all_games" badge

### 4. Leaderboards
```bash
curl http://localhost:3000/api/leaderboards/reaction-time?page=1&limit=10
```

**Expected:** Top 10 players with best scores (lower is better for reaction-time)

### 5. Account Progress
```bash
curl http://localhost:3000/api/account/progress \
  -H "Cookie: next-auth.session-token=..."
```

**Expected:** Best scores, sparklines (max 10 points), attempt counts

---

## 🗂️ File Structure

```
humanbenchmark/
├── prisma/
│   ├── schema.prisma           ✅ Updated
│   ├── seed.ts                 ✅ New (master seed)
│   ├── seed-games.ts           ✅ New
│   └── seed-badges.ts          ✅ Existing
├── src/
│   ├── lib/
│   │   ├── streak-calculator.ts      ✅ New
│   │   ├── badge-triggers.ts         ✅ New
│   │   ├── sparkline-aggregator.ts   ✅ New
│   │   └── game-config.ts            (Existing - kept for compatibility)
│   └── app/
│       └── api/
│           ├── results/route.ts                  ✅ Enhanced
│           └── leaderboards/[gameSlug]/route.ts  ✅ New
```

---

## 🚀 Next Steps

1. **Start PostgreSQL database** (if not running)
2. **Run migration commands** (see above)
3. **Test all acceptance criteria**
4. **Optional:** Update existing API routes to use `Game` table instead of hardcoded config
5. **Optional:** Add data export endpoint for GDPR compliance
6. **Optional:** Add rate limiting to `/api/results` POST

---

## 📊 Performance Optimizations

### Implemented
- ✅ DailyAggregate for fast sparkline queries
- ✅ UserStats for cached totals (avoid COUNT queries)
- ✅ Composite indexes on Result table
- ✅ Paginated leaderboards (max 100 per page)

### Database Indexes
All indexes have been defined in `schema.prisma` and will be created during migration.

**Critical indexes:**
- `Result`: `@@index([gameSlug, score])` - Leaderboard queries
- `Result`: `@@index([userId, gameSlug, createdAt])` - User progress
- `DailyAggregate`: `@@unique([userId, gameId, dayKey])` - Upsert operations

---

## 🔐 Security Notes

### Already Implemented
- ✅ Password hashing (bcryptjs)
- ✅ Session tokens (NextAuth)
- ✅ Cascade deletes (user deletion removes all related data)
- ✅ Anonymous results supported (userId nullable)

### Recommended
- 🔲 Add rate limiting to result submission
- 🔲 Add data export endpoint
- 🔲 Use secret management service in production

---

## 📞 Support

If migration fails:

1. Check database connection: `psql -U johndoe -h localhost -d mydb`
2. Check Prisma logs: `npx prisma migrate dev --name test`
3. Reset database (if needed): `npx prisma migrate reset`

For questions about the architecture, refer to:
- [Implementation Plan](file:///Users/raphaattlan/.gemini/antigravity/brain/63ccd51c-31c1-4f89-a342-39bc682b7644/implementation_plan.md)
- [Task Checklist](file:///Users/raphaattlan/.gemini/antigravity/brain/63ccd51c-31c1-4f89-a342-39bc682b7644/task.md)
