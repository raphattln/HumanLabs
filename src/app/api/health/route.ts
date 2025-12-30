import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const startTime = Date.now();
    const checks: Record<string, any> = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    };

    // Check 1: Prisma client exists
    try {
        checks.prismaClient = "initialized";
    } catch (error) {
        checks.prismaClient = "error";
        checks.prismaError = String(error);
    }

    // Check 2: Database connection
    try {
        await prisma.$connect();
        checks.database = "connected";
    } catch (error: any) {
        checks.database = "failed";
        checks.databaseError = {
            message: error.message,
            code: error.code,
            meta: error.meta,
        };
    }

    // Check 3: Can query database
    try {
        const userCount = await prisma.user.count();
        checks.query = "success";
        checks.userCount = userCount;
    } catch (error: any) {
        checks.query = "failed";
        checks.queryError = {
            message: error.message,
            code: error.code,
            meta: error.meta,
        };
    }

    // Check 4: Tables exist
    try {
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
        checks.tables = tables;
    } catch (error: any) {
        checks.tablesError = {
            message: error.message,
            code: error.code,
        };
    }

    const responseTime = Date.now() - startTime;

    const isHealthy = checks.database === "connected" && checks.query === "success";

    return NextResponse.json(
        {
            status: isHealthy ? "healthy" : "unhealthy",
            checks,
            responseTime: `${responseTime}ms`,
            databaseUrl: process.env.DATABASE_URL ?
                `${process.env.DATABASE_URL.split('@')[1] || 'configured'}` :
                'not configured',
        },
        { status: isHealthy ? 200 : 503 }
    );
}
