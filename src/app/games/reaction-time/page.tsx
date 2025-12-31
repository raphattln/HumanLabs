"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameLayout } from "@/components/game-layout";
import { Zap, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type GameState = "idle" | "waiting" | "ready" | "result" | "too-early";

export default function ReactionTimePage() {
    const [state, setState] = useState<GameState>("idle");
    const [startTime, setStartTime] = useState<number>(0);
    const [result, setResult] = useState<number | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startTest = useCallback(() => {
        setState("waiting");
        const delay = Math.floor(Math.random() * 5000) + 2000; // 2-7 seconds

        timeoutRef.current = setTimeout(() => {
            setState("ready");
            setStartTime(performance.now());
        }, delay);
    }, []);

    const handleClick = useCallback(() => {
        if (state === "idle" || state === "result" || state === "too-early") {
            startTest();
        } else if (state === "waiting") {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setState("too-early");
        } else if (state === "ready") {
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            setResult(duration);
            setState("result");
            saveResult(duration);
        }
    }, [state, startTime, startTest]);

    const saveResult = async (score: number) => {
        try {
            await fetch("/api/scores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameSlug: "reaction-time",
                    value: score,
                    meta: { reaction_time: score },
                }),
            });
        } catch (error) {
            console.error("Failed to save result", error);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                handleClick();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleClick]);

    return (
        <GameLayout
            title="Reaction Time"
            description="Test your visual reflexes and see how you rank against the average human response time (approx. 273ms)."
            instructions="Wait for the red background to turn green, then click or press Space/Enter as fast as you can!"
            icon={Zap}
            gameStatus={state === "result" ? "result" : "playing"}
            onReset={startTest}
            shareData={
                result
                    ? {
                        title: "My Reaction Time",
                        text: `⚡️ My Reaction Time is ${result}ms! Can you beat me? #HumanBenchmark`,
                        url: "https://humanbenchmark.com",
                    }
                    : undefined
            }
        >
            <div
                onClick={handleClick}
                className={cn(
                    "flex-grow flex flex-col items-center justify-center cursor-pointer select-none transition-colors duration-0",
                    state === "idle" && "bg-accent/5 hover:bg-accent/10",
                    state === "waiting" && "bg-red-500",
                    state === "ready" && "bg-green-500",
                    (state === "result" || state === "too-early") && "bg-background"
                )}
                aria-live="polite"
                role="button"
                tabIndex={0}
            >
                <div className="text-center p-8">
                    {state === "idle" && (
                        <>
                            <Zap className="w-16 h-16 mx-auto mb-6 text-accent animate-pulse" />
                            <h2 className="text-3xl font-heading font-bold mb-2 text-foreground">Click to Start</h2>
                            <p className="text-muted-foreground">Test your reflexes</p>
                        </>
                    )}

                    {state === "waiting" && (
                        <>
                            <Clock className="w-16 h-16 mx-auto mb-6 text-white animate-spin-slow" />
                            <h2 className="text-4xl font-heading font-bold text-white">Wait for green...</h2>
                        </>
                    )}

                    {state === "ready" && (
                        <>
                            <Zap className="w-24 h-24 mx-auto mb-6 text-white fill-white" />
                            <h2 className="text-5xl font-heading font-bold text-white">CLICK!</h2>
                        </>
                    )}

                    {state === "too-early" && (
                        <>
                            <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
                            <h2 className="text-4xl font-heading font-bold mb-4">Too soon!</h2>
                            <p className="text-muted-foreground mb-8">Wait for green before clicking.</p>
                            <Button size="lg">Try Again</Button>
                        </>
                    )}

                    {state === "result" && (
                        <>
                            <div className="text-7xl font-heading font-bold mb-4 text-foreground">
                                {result} <span className="text-2xl text-muted-foreground font-normal">ms</span>
                            </div>
                            <p className="text-muted-foreground mb-8">Great job! See how you rank on the leaderboards.</p>
                            <Button size="lg">Save & Play Again</Button>
                        </>
                    )}
                </div>
            </div>
        </GameLayout>
    );
}
