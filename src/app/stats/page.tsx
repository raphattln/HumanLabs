"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Zap,
    Target,
    Boxes,
    Brain,
    Binary,
    Languages,
    Grip,
    Keyboard,
    PlayCircle,
    Palette,
    Clock,
    BarChart3,
    ArrowRight
} from "lucide-react";

// Helper for charts
const Sparkline = ({ data, color, higherIsBetter }: { data: number[], color: string, higherIsBetter: boolean }) => {
    if (data.length < 2) return <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">Not enough data</div>;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Normalize points to 0-100 height
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 80 - 10; // Padding
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="h-24 w-full relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points={points}
                    vectorEffect="non-scaling-stroke"
                    className={color}
                />
            </svg>
            {/* Simple trend indicator */}
            <div className="absolute bottom-0 right-0 text-xs font-bold">
                {data.length} plays
            </div>
        </div>
    );
};

// Skeleton card for loading state
const SkeletonCard = () => (
    <Card className="p-6 flex flex-col animate-pulse">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10" />
            <div className="flex-1">
                <div className="h-4 bg-accent/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-accent/10 rounded w-1/2" />
            </div>
        </div>
        <div className="h-24 bg-accent/5 rounded" />
    </Card>
);

const games = [
    { name: "Reaction Time", slug: "reaction-time", icon: Zap, color: "text-blue-500", higherIsBetter: false },
    { name: "Aim Trainer", slug: "aim-trainer", icon: Target, color: "text-red-500", higherIsBetter: false },
    { name: "Sequence Memory", slug: "sequence-memory", icon: Boxes, color: "text-amber-500", higherIsBetter: true },
    { name: "Visual Memory", slug: "visual-memory", icon: Brain, color: "text-purple-500", higherIsBetter: true },
    { name: "Number Memory", slug: "number-memory", icon: Binary, color: "text-emerald-500", higherIsBetter: true },
    { name: "Verbal Memory", slug: "verbal-memory", icon: Languages, color: "text-indigo-500", higherIsBetter: true },
    { name: "Chimp Test", slug: "chimp-test", icon: Grip, color: "text-orange-500", higherIsBetter: true },
    { name: "Typing Test", slug: "typing-test", icon: Keyboard, color: "text-cyan-500", higherIsBetter: true },
    { name: "Go / No-Go", slug: "go-no-go", icon: PlayCircle, color: "text-green-500", higherIsBetter: true },
    { name: "Stroop Test", slug: "stroop-test", icon: Palette, color: "text-pink-500", higherIsBetter: true },
    { name: "Time Estimation", slug: "time-estimation", icon: Clock, color: "text-teal-500", higherIsBetter: true },
];

export default function StatsPage() {
    const { data: session, status } = useSession();
    const [summary, setSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "authenticated") {
            const fetchStats = async () => {
                try {
                    const res = await fetch("/api/performance/summary");
                    if (res.ok) {
                        const data = await res.json();
                        setSummary(data);
                        setError(null);
                    } else {
                        setError("Failed to load performance data");
                    }
                } catch (e) {
                    console.error("Failed to load performance summary", e);
                    setError("Failed to load performance data");
                } finally {
                    setLoading(false);
                }
            };
            fetchStats();
        }
    }, [status]);

    if (status === "loading") {
        return (
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-heading font-bold mb-8">My Performance</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(11)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="container mx-auto px-4 py-24 text-center max-w-2xl">
                <BarChart3 className="w-20 h-20 mx-auto mb-6 text-accent/50" />
                <h1 className="text-4xl font-heading font-bold mb-6">Track Your Progress</h1>
                <p className="text-xl text-muted-foreground mb-12">
                    Log in to see your history, track improvements, and visualize your cognitive growth over time.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/login"><Button size="lg">Log In</Button></Link>
                    <Link href="/signup"><Button variant="outline" size="lg">Sign Up</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-heading font-bold mb-8">My Performance</h1>

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(11)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <>
                    {summary.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                            <h3 className="text-xl font-bold mb-2">No Stats Recorded Yet</h3>
                            <p className="text-muted-foreground mb-6">Play your first game to see your performance metrics here.</p>
                            <Link href="/games">
                                <Button>Go to Games</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {summary.map((stat) => {
                                // Match icons from our local map if possible, or fallback
                                const localGame = games.find(g => g.slug === stat.gameSlug);
                                const Icon = localGame?.icon || Zap;
                                const color = localGame?.color || "text-gray-500";
                                const hasPlayed = stat.plays > 0;

                                return (
                                    <Card key={stat.gameSlug} className="p-6 flex flex-col hover:shadow-lg transition-shadow">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`p-2 rounded-lg bg-accent/5 ${color}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold">{stat.name}</div>
                                                {hasPlayed ? (
                                                    <>
                                                        <div className="text-xs text-muted-foreground">
                                                            Best: <span className="text-foreground font-medium">{stat.best}</span> {stat.unit}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            Played {stat.plays} {stat.plays === 1 ? 'time' : 'times'}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-xs text-muted-foreground">
                                                            Best: <span className="text-foreground font-medium">—</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            Not played yet
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-grow flex items-end">
                                            {hasPlayed && stat.recentScores && stat.recentScores.length >= 2 ? (
                                                <Sparkline
                                                    data={stat.recentScores}
                                                    color={color}
                                                    higherIsBetter={stat.higherIsBetter}
                                                />
                                            ) : hasPlayed ? (
                                                <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
                                                    Not enough data for chart
                                                </div>
                                            ) : (
                                                <div className="h-24 flex items-center justify-center">
                                                    <Link href={`/games/${stat.gameSlug}`}>
                                                        <Button variant="outline" size="sm" className="gap-2">
                                                            Play now
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
