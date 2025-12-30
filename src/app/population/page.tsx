
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, BarChart } from "lucide-react";

export default function PopulationPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/population/summary")
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-12 text-center">Loading population data...</div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex items-center gap-4 mb-8">
                <Users className="w-10 h-10 text-primary" />
                <h1 className="text-3xl font-heading font-bold">Global Benchmarks</h1>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl">
                See how humans perform on average. Statistics are calculated daily from thousands of test results.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((game) => (
                    <Card key={game.gameSlug} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{game.gameName}</h3>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                                    {game.scoreDirection === "LOWER_BETTER" ? "Lower is better" : "Higher is better"}
                                </div>
                            </div>
                            <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                                {game.plays.toLocaleString()} plays
                            </div>
                        </div>

                        {game.hasData ? (
                            <div className="space-y-4">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm text-muted-foreground">Average (Mean)</span>
                                    <span className="font-mono font-bold text-lg">{Math.round(game.mean)} <span className="text-xs text-muted-foreground">{game.scoreUnit}</span></span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm text-muted-foreground">Median (P50)</span>
                                    <span className="font-mono font-bold text-lg text-primary">{Math.round(game.p50)} <span className="text-xs text-muted-foreground">{game.scoreUnit}</span></span>
                                </div>

                                <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center text-sm">
                                    <div>
                                        <div className="text-muted-foreground text-xs mb-1">Top 25%</div>
                                        <div className="font-bold font-mono">
                                            {game.scoreDirection === "LOWER_BETTER" ? Math.round(game.p25) : Math.round(game.p75)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs mb-1">Average</div>
                                        <div className="font-bold">{Math.round(game.p50)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs mb-1">Top 1%</div>
                                        <div className="font-bold font-mono">
                                            {game.scoreDirection === "LOWER_BETTER" ? Math.round(game.min) : Math.round(game.max)}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground text-right mt-2">
                                    Updated: {new Date(game.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm italic">
                                No global data yet.
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
