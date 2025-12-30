import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const prefs = await prisma.preferences.findUnique({
            where: { userId: session.user.id }
        });

        return NextResponse.json(prefs || { reducedMotion: false, highContrast: false, largeText: false });
    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { reducedMotion, highContrast, largeText } = await req.json();

        // Upsert
        const prefs = await prisma.preferences.upsert({
            where: { userId: session.user.id },
            update: { reducedMotion, highContrast, largeText },
            create: { userId: session.user.id, reducedMotion, highContrast, largeText }
        });

        return NextResponse.json(prefs);
    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
