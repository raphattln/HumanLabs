"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { User, Activity, Info, CreditCard, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const navItems = [
    { name: "How it works", href: "/how-it-works", icon: Info },
    { name: "Games", href: "/games", icon: Activity },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
];

export function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileMenuOpen]);

    // Close menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-8">
                    <Link
                        href="/"
                        className="text-xl font-heading font-bold text-foreground hover:opacity-80 transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Human<span className="text-accent">Labs</span>
                    </Link>

                    {/* Desktop Navigation */}
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

                {/* Desktop Auth & Mobile Toggle */}
                <div className="flex items-center gap-4">
                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-4">
                        {status === "loading" ? (
                            <div className="h-8 w-24 animate-pulse bg-muted rounded-lg" />
                        ) : session ? (
                            <Link href="/account" className="flex items-center gap-2">
                                <span className="text-sm font-medium">{session?.user?.name || session?.user?.email?.split('@')[0] || "User"}</span>
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
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">Log in</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm">Get Started</Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={isMobileMenuOpen}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Overlay & Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex justify-end md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div
                        className="relative h-full w-[300px] bg-background border-l border-border p-6 shadow-xl animate-in slide-in-from-right duration-300 flex flex-col gap-6"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile navigation"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-heading font-bold text-lg">Menu</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-label="Close menu"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-4 py-2 text-lg font-medium transition-colors hover:text-accent",
                                        pathname === item.href ? "text-accent" : "text-muted-foreground"
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        <div className="mt-auto border-t border-border pt-6 flex flex-col gap-4">
                            {status === "loading" ? (
                                <div className="h-10 w-full animate-pulse bg-muted rounded-lg" />
                            ) : session ? (
                                <Link
                                    href="/account"
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {session?.user?.avatarEmoji ? (
                                        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-xl">
                                            {session.user.avatarEmoji}
                                        </div>
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                            <User className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-medium">{session?.user?.name || "User"}</span>
                                        <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full justify-center">Log in</Button>
                                    </Link>
                                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="w-full justify-center">Get Started</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
