"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { User, LogOut, Settings, Save, Moon, Sun, Coffee } from "lucide-react";
import { useRouter } from "next/navigation";
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react';
import { useTheme } from "@/components/theme-provider";

export default function AccountPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    const [reducedMotion, setReducedMotion] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [largeText, setLargeText] = useState(false);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);

    useEffect(() => {
        if (status === "authenticated") {
            // Fetch existing preferences
            fetch("/api/preferences")
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setReducedMotion(data.reducedMotion);
                        setHighContrast(data.highContrast);
                        setLargeText(data.largeText);
                    }
                })
                .catch(err => console.error(err));

            // Fetch stats
            fetch("/api/stats/overview")
                .then(res => res.json())
                .then(data => setStats(data))
                .catch(err => console.error(err));
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user?.avatarEmoji) {
            setAvatarEmoji(session.user.avatarEmoji);
        }
    }, [session]);

    const onEmojiClick = async (emojiData: EmojiClickData) => {
        const newEmoji = emojiData.emoji;
        setAvatarEmoji(newEmoji);
        setShowEmojiPicker(false);

        try {
            const res = await fetch("/api/user/avatar", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarEmoji: newEmoji }),
            });

            if (res.ok) {
                // Update session to reflect change in Navbar immediately
                await update({ avatarEmoji: newEmoji });
            }
        } catch (error) {
            console.error("Failed to save emoji avatar", error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch("/api/preferences", {
                method: "POST",
                body: JSON.stringify({
                    reducedMotion,
                    highContrast,
                    largeText
                })
            });
            // Apply logic (reload or context update)
            // Just show success.
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (status !== "authenticated") return null;

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-heading font-bold mb-8">Dashboard</h1>

            {/* Helper for visual debug */}
            {/* <pre>{JSON.stringify(stats, null, 2)}</pre> */}

            {/* Rank Computation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-1">Total Plays</div>
                    <div className="text-3xl font-bold">{stats?.totalPlays || 0}</div>
                </Card>
                <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-1">Current Streak</div>
                    <div className="text-3xl font-bold">{stats?.currentStreak || 0} <span className="text-sm font-normal text-muted-foreground">days</span></div>
                </Card>
                <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-1">Best Streak</div>
                    <div className="text-3xl font-bold">{stats?.bestStreak || 0} <span className="text-sm font-normal text-muted-foreground">days</span></div>
                </Card>
            </div>

            {stats?.recentBadges && Array.isArray(stats.recentBadges) && stats.recentBadges.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Recent Badges</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.recentBadges.map((badge: any) => (
                            <Card key={badge.code} className="p-4 flex flex-col items-center text-center">
                                <div className="text-4xl mb-2">{badge.icon}</div>
                                <div className="font-bold text-sm">{badge.name}</div>
                                <div className="text-xs text-muted-foreground">{badge.description}</div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-muted-foreground" />
                        Profile
                    </h2>
                    <Card className="p-6 mb-8">
                        <div className="flex items-center gap-4 mb-6">

                            <div className="relative">
                                <div
                                    className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center text-3xl cursor-pointer hover:bg-accent/30 transition-colors"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                    {avatarEmoji ? (
                                        <div className="select-none">{avatarEmoji}</div>
                                    ) : session?.user?.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={session.user.image} alt="User" className="h-16 w-16 rounded-full" />
                                    ) : (
                                        <User className="h-8 w-8" />
                                    )}
                                </div>
                                {showEmojiPicker && (
                                    <div className="absolute top-20 left-0 z-50">
                                        <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                        <div className="relative z-50">
                                            <EmojiPicker
                                                onEmojiClick={onEmojiClick}
                                                theme={EmojiTheme.AUTO}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{session?.user?.name || "User"}</h2>
                                <p className="text-muted-foreground">{session?.user?.email}</p>
                            </div>
                        </div>

                        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })} className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full justify-start">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </Card>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                        Preferences
                    </h2>
                    <Card className="p-6 space-y-6">
                        <div>
                            <h3 className="font-medium mb-3">Theme</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${theme === "light" ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20"
                                        }`}
                                >
                                    <Sun className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-medium">Light</span>
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${theme === "dark" ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20"
                                        }`}
                                >
                                    <Moon className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-medium">Dark</span>
                                </button>
                                <button
                                    onClick={() => setTheme("cream")}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${theme === "cream" ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20"
                                        }`}
                                >
                                    <Coffee className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-medium">Cream</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Reduced Motion</div>
                                <p className="text-sm text-muted-foreground">Minimize animations.</p>
                            </div>
                            <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">High Contrast</div>
                                <p className="text-sm text-muted-foreground">Increase contrast.</p>
                            </div>
                            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Large Text</div>
                                <p className="text-sm text-muted-foreground">Larger font size.</p>
                            </div>
                            <Switch checked={largeText} onCheckedChange={setLargeText} />
                        </div>

                        <div className="pt-4 border-t border-border">
                            <Button onClick={handleSave} disabled={saving} className="w-full">
                                {saving ? "Saving..." : "Save Preferences"}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
