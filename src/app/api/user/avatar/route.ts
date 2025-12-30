import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { avatarEmoji } = body;

        // Validation
        if (typeof avatarEmoji !== "string" || avatarEmoji.length === 0) {
            return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
        }

        // Simple length check - emoji characters can be 2-4 bytes usually. 
        // Allowing up to 8 chars to be safe for complex emojis (like family emoji), 
        // but we want to prevent abuse with long strings.
        if ([...avatarEmoji].length > 4) {
            return NextResponse.json({ error: "Only single emoji allowed" }, { status: 400 });
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { avatarEmoji },
        });

        return NextResponse.json({ ok: true, avatarEmoji: updatedUser.avatarEmoji });
    } catch (error) {
        console.error("Error updating avatar:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
