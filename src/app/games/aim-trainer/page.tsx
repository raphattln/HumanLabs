"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameLayout } from "@/components/game-layout";
import { Target, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GameState = "idle" | "playing" | "result";

const TOTAL_TARGETS = 30;

export default function AimTrainerPage() {
    const [state, setState] = useState<GameState>("idle");
    const [targetsHit, setTargetsHit] = useState(0);
    const [startTime, setStartTime] = useState<number>(0);
    const [result, setResult] = useState<number | null>(null);
    const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
    const containerRef = useRef<HTMLDivElement>(null);

    const spawnTarget = useCallback(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            // Keep target 5% away from edges
            const x = Math.random() * 90 + 5;
            const y = Math.random() * 90 + 5;
            setTargetPos({ x, y });
        }
    }, []);

    const startGame = () => {
        setTargetsHit(0);
        setStartTime(performance.now());
        setState("playing");
        spawnTarget();
    };

    const handleTargetClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextHit = targetsHit + 1;

        if (nextHit >= TOTAL_TARGETS) {
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const avgTime = Math.round(totalTime / TOTAL_TARGETS);
            setResult(avgTime);
            setState("result");
            saveResult(avgTime);
        } else {
            setTargetsHit(nextHit);
            spawnTarget();
        }
    };

    const saveResult = async (score: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                body: JSON.stringify({
                    gameSlug: "aim-trainer",
                    score,
                    metadata: { avg_ms: score, total_targets: TOTAL_TARGETS },
                }),
            });
        } catch (error) {
            console.error("Failed to save result", error);
        }
    };

    return (
        <GameLayout
            title="Aim Trainer"
            description="Hit 30 targets as quickly as you can. This test measures your mouse precision and speed."
            instructions="Click the targets as they appear. The faster you click all 30, the better your score."
            icon={Target}
            gameStatus={state === "result" ? "result" : "playing"}
            onReset={startGame}
        >
            <div
                ref={containerRef}
                className={cn(
                    "flex-grow relative overflow-hidden bg-accent/5 select-none",
                    state === "playing" ? "cursor-crosshair" : "cursor-default"
                )}
            >
                {state === "idle" && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-background/50 backdrop-blur-sm z-10 cursor-pointer"
                        onClick={startGame}
                    >
                        <Target className="w-16 h-16 mb-6 text-accent animate-pulse" />
                        <h2 className="text-3xl font-heading font-bold mb-2">Click to Start</h2>
                        <p className="text-muted-foreground">Hit 30 targets</p>
                    </div>
                )}

                {state === "playing" && (
                    <>
                        <div className="absolute top-4 left-4 font-bold text-accent text-lg z-10 bg-background/80 px-4 py-2 rounded-full border border-border">
                            Remaining: {TOTAL_TARGETS - targetsHit}
                        </div>

                        <button
                            onClick={handleTargetClick}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-accent hover:scale-110 active:scale-95 transition-transform flex items-center justify-center shadow-lg focus:outline-none"
                            style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
                            aria-label="Click target"
                        >
                            <div className="w-8 h-8 rounded-full border-4 border-white/50" />
                            <div className="absolute w-2 h-2 rounded-full bg-white" />
                        </button>
                    </>
                )}

                {state === "result" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-background">
                        <div className="mb-2 text-sm uppercase tracking-widest text-muted-foreground font-bold">Average time per target</div>
                        <div className="text-7xl font-heading font-bold mb-4 text-foreground">
                            {result} <span className="text-2xl text-muted-foreground font-normal">ms</span>
                        </div>
                        <p className="text-muted-foreground mb-8">Great accuracy!</p>
                        <Button size="lg" onClick={startGame}>Save & Play Again</Button>
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
