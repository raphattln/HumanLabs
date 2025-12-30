"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { User, Activity, Info, CreditCard, LogOut } from "lucide-react";

import { useSession } from "next-auth/react";

const navItems = [
    { name: "How it works", href: "/how-it-works", icon: Info },
    { name: "Games", href: "/games", icon: Activity },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
];

export function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-8">
                    <Link
                        href="/"
                        className="text-xl font-heading font-bold text-foreground hover:opacity-80 transition-opacity"
                    >
                        Human<span className="text-accent">Labs</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-accent",
                                    pathname === item.href ? "text-accent" : "text-muted-foreground"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {status === "loading" ? (
                        <div className="h-8 w-24 animate-pulse bg-muted rounded-lg" />
                    ) : session ? (
                        <Link href="/account" className="flex items-center gap-2">
                            <span className="hidden sm:block text-sm font-medium">{session?.user?.name || session?.user?.email?.split('@')[0] || "User"}</span>
                            {session?.user?.avatarEmoji ? (
                                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-lg">
                                    {session.user.avatarEmoji}
                                </div>
                            ) : (
                                <Button variant="secondary" size="sm" className="px-2">
                                    <User className="h-5 w-5" />
                                </Button>
                            )}
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="hidden sm:block">
                                <Button variant="ghost" size="sm">Log in</Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
