"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
    Zap,
    Target,
    Boxes,
    Brain,
    Binary,
    Languages,
    Grip,
    Keyboard,
    Trophy,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";

const games = [
    { name: "Reaction Time", slug: "reaction-time", icon: Zap, unit: "ms" },
    { name: "Aim Trainer", slug: "aim-trainer", icon: Target, unit: "ms" },
    { name: "Sequence Memory", slug: "sequence-memory", icon: Boxes, unit: "lvl" },
    { name: "Visual Memory", slug: "visual-memory", icon: Brain, unit: "lvl" },
    { name: "Number Memory", slug: "number-memory", icon: Binary, unit: "digits" },
    { name: "Verbal Memory", slug: "verbal-memory", icon: Languages, unit: "score" },
    { name: "Chimp Test", slug: "chimp-test", icon: Grip, unit: "score" },
    { name: "Typing Test", slug: "typing-test", icon: Keyboard, unit: "wpm" },
];

interface Result {
    id: string;
    score: number;
    createdAt: string;
    user: {
        displayName: string | null;
        image: string | null;
    } | null;
}

export default function LeaderboardPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    // Validate slug
    const currentGame = games.find(g => g.slug === slug);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentGame) {
            router.push("/leaderboards/reaction-time");
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/results?gameSlug=${slug}&limit=50`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error("Failed to fetch leaderboards", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [slug, currentGame, router]);

    if (!currentGame) return null;

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-heading font-bold mb-4 flex items-center justify-center gap-3">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                    Global Leaderboards
                </h1>
                <p className="text-muted-foreground">See how you compare against the world's best.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-1">
                    {games.map((game) => (
                        <Link key={game.slug} href={`/leaderboards/${game.slug}`}>
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                slug === game.slug
                                    ? "bg-accent/10 text-accent"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}>
                                <game.icon className="w-4 h-4" />
                                {game.name}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Main Content */}
                <Card className="flex-grow min-h-[500px]">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <currentGame.icon className="w-6 h-6 text-accent" />
                            {currentGame.name} Leaders
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4 w-16">Rank</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4 text-right">Score</th>
                                    <th className="px-6 py-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 w-4 bg-muted rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-32 bg-muted rounded"></div></td>
                                            <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-muted rounded ml-auto"></div></td>
                                            <td className="px-6 py-4 text-right"><div className="h-4 w-20 bg-muted rounded ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : results.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                            No scores recorded yet. Be the first!
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((result, index) => (
                                        <tr key={result.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-muted-foreground">
                                                #{index + 1}
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                <div className="flex items-center gap-2">
                                                    {/* Avatar placeholder if no image */}
                                                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs">
                                                        {result.user?.displayName?.charAt(0) || <User className="w-3 h-3" />}
                                                    </div>
                                                    {result.user?.displayName || "Anonymous"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-lg">
                                                {result.score} <span className="text-xs font-normal text-muted-foreground ml-1">{currentGame.unit}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-muted-foreground">
                                                {new Date(result.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
