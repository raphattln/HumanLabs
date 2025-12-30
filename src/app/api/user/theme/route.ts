import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_THEMES = ["light", "dark", "cream"];

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { theme } = body;

        if (!theme || !VALID_THEMES.includes(theme)) {
            return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { theme },
        });

        return NextResponse.json({ ok: true, theme: updatedUser.theme });
    } catch (error) {
        console.error("Error updating theme:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
