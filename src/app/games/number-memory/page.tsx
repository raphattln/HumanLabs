"use client";

import { useState, useRef, useEffect } from "react";
import { GameLayout } from "@/components/game-layout";
import { Binary, RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type GameState = "idle" | "memorize" | "input" | "result";

export default function NumberMemoryPage() {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [level, setLevel] = useState(1);
    const [currentNumber, setCurrentNumber] = useState("");
    const [userInput, setUserInput] = useState("");
    const [timeLeft, setTimeLeft] = useState(100);
    const inputRef = useRef<HTMLInputElement>(null);

    const generateNumber = (length: number) => {
        let num = "";
        for (let i = 0; i < length; i++) {
            num += Math.floor(Math.random() * 10).toString();
        }
        return num;
    };

    // Calculate responsive font size based on number length
    const getFontSize = (digitCount: number) => {
        if (digitCount <= 3) return "text-8xl md:text-9xl"; // Very large
        if (digitCount <= 5) return "text-7xl md:text-8xl"; // Large
        if (digitCount <= 7) return "text-6xl md:text-7xl"; // Medium-large
        if (digitCount <= 10) return "text-5xl md:text-6xl"; // Medium
        if (digitCount <= 15) return "text-4xl md:text-5xl"; // Medium-small
        if (digitCount <= 20) return "text-3xl md:text-4xl"; // Small
        return "text-2xl md:text-3xl"; // Very small for 20+
    };

    const startLevel = (lvl: number) => {
        const num = generateNumber(lvl); // level 1 = 1 digit, level 5 = 5 digits
        setCurrentNumber(num);
        setUserInput("");
        setGameState("memorize");
        setTimeLeft(100);

        // Calculate display time: e.g. 1000ms + 500ms per digit
        const displayTime = 1000 + lvl * 600;
        const startTime = performance.now();

        const animate = () => {
            const now = performance.now();
            const elapsed = now - startTime;
            const remaining = Math.max(0, 100 - (elapsed / displayTime) * 100);

            setTimeLeft(remaining);

            if (remaining > 0) {
                requestAnimationFrame(animate);
            } else {
                setGameState("input");
            }
        };
        requestAnimationFrame(animate);
    };

    const startGame = () => {
        setLevel(1);
        startLevel(1);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        if (userInput === currentNumber) {
            // Correct
            setLevel((l) => {
                const next = l + 1;
                startLevel(next);
                return next;
            });
        } else {
            // Wrong
            setGameState("result");
            saveResult(level - 1);
        }
    };

    useEffect(() => {
        if (gameState === "input" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [gameState]);

    const saveResult = async (score: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameSlug: "number-memory",
                    score,
                    metadata: { level: score },
                }),
            });
        } catch (error) {
            console.error("Failed to save result", error);
        }
    };

    return (
        <GameLayout
            title="Number Memory"
            description="The average person can remember 7 numbers at once. Can you do more?"
            instructions="Memorize the number shown. When it disappears, type it in."
            icon={Binary}
            gameStatus={gameState === "result" ? "result" : "playing"}
            onReset={startGame}
        >
            <div className="flex-grow flex flex-col items-center justify-center min-h-[500px] p-4 sm:p-8">
                {gameState === "idle" && (
                    <div className="text-center">
                        <Binary className="w-20 h-20 mx-auto mb-6 text-accent" />
                        <h2 className="text-3xl font-heading font-bold mb-4">Number Memory</h2>
                        <Button size="lg" onClick={startGame} className="gap-2">
                            <Play className="w-4 h-4" /> Start Game
                        </Button>
                    </div>
                )}

                {gameState === "memorize" && (
                    <div className="text-center w-full max-w-6xl animate-in fade-in zoom-in duration-300 px-4">
                        {/* Responsive text size based on digit count */}
                        <div
                            className={`${getFontSize(currentNumber.length)} font-bold font-mono tracking-wider mb-8 break-all leading-tight`}
                            style={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                            }}
                        >
                            {currentNumber}
                        </div>
                        <Progress value={timeLeft} className="h-4 w-full max-w-2xl mx-auto" />
                    </div>
                )}

                {gameState === "input" && (
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-md px-4 text-center animate-in fade-in duration-300"
                    >
                        <div className="mb-6 text-2xl font-bold">What was the number?</div>
                        <Input
                            ref={inputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={userInput}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setUserInput(e.target.value)
                            }
                            className="text-center text-3xl sm:text-4xl h-16 sm:h-20 font-mono tracking-widest mb-6"
                            autoComplete="off"
                            placeholder="Type the number"
                        />
                        <div className="text-muted-foreground text-sm mb-8">
                            Press Enter to submit
                        </div>
                        <Button type="submit" size="lg" className="w-full">
                            Submit
                        </Button>
                    </form>
                )}

                {gameState === "result" && (
                    <div className="text-center w-full max-w-md px-4 animate-in fade-in zoom-in duration-300">
                        <div className="mb-2 text-muted-foreground text-lg">Level Reached</div>
                        <div className="text-8xl font-heading font-bold mb-8 text-foreground">
                            {level}
                        </div>

                        <div className="bg-muted/30 p-6 rounded-xl mb-8 text-left space-y-4">
                            <div>
                                <div className="text-xs uppercase text-muted-foreground font-bold mb-1">
                                    Correct Number
                                </div>
                                <div className="font-mono text-lg sm:text-xl break-all">
                                    {currentNumber}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-muted-foreground font-bold mb-1">
                                    Your Answer
                                </div>
                                <div className="font-mono text-lg sm:text-xl text-red-500 line-through decoration-2 break-all">
                                    {userInput}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 justify-center">
                            <Button size="lg" onClick={startGame} className="gap-2 px-8">
                                <RotateCcw className="w-4 h-4" /> Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
