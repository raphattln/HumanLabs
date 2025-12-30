import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/health/db
 * 
 * Database health check endpoint
 * Tests connection and returns detailed error information in development
 */
export async function GET() {
    try {
        // Test basic connection
        await prisma.$queryRaw`SELECT 1 as health_check`;

        // Test if tables exist by checking for User table
        const userCount = await prisma.user.count();

        return NextResponse.json({
            ok: true,
            timestamp: new Date().toISOString(),
            database: 'connected',
            tables: 'accessible',
            userCount,
        });
    } catch (error: any) {
        const isDev = process.env.NODE_ENV !== 'production';

        // Detailed error response in development
        const errorResponse: any = {
            ok: false,
            timestamp: new Date().toISOString(),
            error: isDev ? error.message : 'Database connection failed',
        };

        if (isDev) {
            errorResponse.details = {
                code: error.code,
                meta: error.meta,
                name: error.name,
            };

            // Specific error messages
            if (error.code === 'P1001') {
                errorResponse.help = 'Cannot reach database server. Is PostgreSQL running?';
                errorResponse.fix = 'Run: npx @databases/pg-test start';
            } else if (error.code === 'P2021') {
                errorResponse.help = 'Table does not exist. Migrations not applied.';
                errorResponse.fix = 'Run: npx prisma migrate dev';
            } else if (error.message?.includes('ECONNREFUSED')) {
                errorResponse.help = 'Connection refused. PostgreSQL not running on port 5432.';
                errorResponse.fix = 'Install and start PostgreSQL or use a cloud database (Supabase/Neon)';
            }
        }

        return NextResponse.json(errorResponse, { status: 503 });
    }
}
