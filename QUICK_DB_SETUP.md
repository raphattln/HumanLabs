# Quick Database Setup (No Docker Required)

Since Docker is not available, here's the fastest way to get the database running:

## Option 1: Supabase (Recommended - Free tier available)

1. **Create account**: https://supabase.com/dashboard
2. **Create new project**:
   - Name: humanbenchmark
   - Database Password: (save this!)
   - Region: Choose closest to you
3. **Get DATABASE_URL**:
   - Go to Project Settings → Database
   - Copy the "Connection string" (URI mode)
   - Should look like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
4. **Update .env**:
   ```bash
   # Replace entire DATABASE_URL line with your Supabase URL
   DATABASE_URL="postgresql://postgres.[your-ref]:[your-password]@..."
   ```
5. **Run migrations**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx tsx prisma/seed.ts
   ```
6. **Start dev server**:
   ```bash
   npm run dev
   ```

## Option 2: Neon (Alternative)

1. **Create account**: https://neon.tech
2. **Create project**: humanbenchmark
3. **Copy connection string** from dashboard
4. **Update .env** with Neon DATABASE_URL
5. **Run same migrations** as above

## Verify Setup

Once complete, visit:
- http://localhost:3000/api/health/db

Should return:
```json
{
  "ok": true,
  "database": "connected",
  "tables": "accessible"
}
```

## Troubleshooting

If you see errors:

- **"Cannot reach database"**: DATABASE_URL in .env is wrong
- **"Table does not exist"**: Run `npx prisma migrate dev`
- **"Connection pool error"**: Using wrong connection string format (use "pooler" URL for Supabase)

---

**Estimated time**: 5 minutes
