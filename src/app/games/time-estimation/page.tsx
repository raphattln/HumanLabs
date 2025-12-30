"use client";

import { useState, useEffect, useRef } from "react";
import { GameLayout } from "@/components/game-layout";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

type GameState = "idle" | "running" | "result";

export default function TimeEstimationPage() {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [startTime, setStartTime] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [score, setScore] = useState(0);
    const [error, setError] = useState(0);

    const targetDuration = 10; // 10 seconds

    const handleStart = () => {
        setGameState("running");
        setStartTime(performance.now());
    };

    const handleStop = () => {
        const endTime = performance.now();
        const elapsed = (endTime - startTime) / 1000; // Convert to seconds
        setElapsedTime(elapsed);

        const absoluteError = Math.abs(elapsed - targetDuration);
        setError(absoluteError);

        // Score: max 100, decrease by 10 per second of error
        const finalScore = Math.max(0, Math.round(100 - (absoluteError * 10)));
        setScore(finalScore);

        setGameState("result");
        saveResult(finalScore);
    };

    const saveResult = async (finalScore: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                body: JSON.stringify({
                    gameSlug: "time-estimation",
                    score: finalScore,
                    metadata: {
                        target: targetDuration,
                        actual: elapsedTime,
                        error: error
                    },
                }),
            });
        } catch (error) {
            console.error("Failed to save result", error);
        }
    };

    const reset = () => {
        setGameState("idle");
        setStartTime(0);
        setElapsedTime(0);
        setScore(0);
        setError(0);
    };

    return (
        <GameLayout
            title="Time Estimation"
            description="How good is your internal clock? Estimate 10 seconds without looking."
            instructions="Click Start, then Stop when you think 10 seconds have passed. No peeking!"
            icon={Clock}
            gameStatus={gameState === "result" ? "result" : "playing"}
            onReset={reset}
        >
            <div className="flex-grow flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/20">
                {gameState === "idle" && (
                    <div className="text-center">
                        <Clock className="w-24 h-24 mx-auto mb-8 text-accent animate-pulse" />
                        <h2 className="text-2xl font-heading font-bold mb-4">
                            Think you can feel time?
                        </h2>
                        <p className="text-muted-foreground mb-12 max-w-md">
                            Click Start, then Stop when you believe exactly 10 seconds have passed.
                        </p>
                        <Button size="lg" onClick={handleStart}>
                            Start Timer
                        </Button>
                    </div>
                )}

                {gameState === "running" && (
                    <div className="text-center">
                        <div className="mb-12">
                            <div className="w-32 h-32 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-8 animate-pulse">
                                <Clock className="w-16 h-16 text-accent" />
                            </div>
                            <p className="text-xl text-muted-foreground">
                                Time is ticking...
                            </p>
                        </div>
                        <Button size="lg" onClick={handleStop} variant="secondary">
                            Stop Now
                        </Button>
                    </div>
                )}

                {gameState === "result" && (
                    <div className="text-center max-w-md">
                        <div className="text-7xl font-heading font-bold mb-4 text-foreground">
                            {score}
                        </div>
                        <p className="text-muted-foreground mb-8">Time Perception Score</p>

                        <div className="bg-muted/50 rounded-2xl p-6 mb-8">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-accent">{elapsedTime.toFixed(2)}s</div>
                                    <div className="text-sm text-muted-foreground">Your estimate</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{targetDuration}s</div>
                                    <div className="text-sm text-muted-foreground">Target</div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border">
                                <div className="text-xl font-semibold">
                                    {error < 1 ? "Amazing!" : error < 2 ? "Great!" : error < 3 ? "Good!" : "Keep practicing!"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Off by {error.toFixed(2)} seconds
                                </div>
                            </div>
                        </div>

                        <Button size="lg" onClick={reset}>Try Again</Button>
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
