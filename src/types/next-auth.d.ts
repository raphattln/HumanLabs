import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            avatarEmoji?: string | null;
            theme?: string | null;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        avatarEmoji?: string | null;
        theme?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        avatarEmoji?: string | null;
        theme?: string | null;
    }
}
