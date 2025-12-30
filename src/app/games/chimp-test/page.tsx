"use client";

import { useState, useEffect, useCallback } from "react";
import { GameLayout } from "@/components/game-layout";
import { Grip, RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GameState = "idle" | "memorize" | "playing" | "result";

export default function ChimpTestPage() {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [level, setLevel] = useState(1);
    const [strikes, setStrikes] = useState(0);
    const [showError, setShowError] = useState(false);

    const ROWS = 5;
    const COLS = 8;

    const [numbers, setNumbers] = useState<Map<number, number>>(new Map());
    const [nextExpected, setNextExpected] = useState(1);

    const generateLevel = useCallback((numCount: number) => {
        const newNumbers = new Map<number, number>();
        const positions = new Set<number>();

        // Pick random positions
        while (positions.size < numCount) {
            positions.add(Math.floor(Math.random() * (ROWS * COLS)));
        }

        // Assign 1 to N
        let i = 1;
        positions.forEach((pos) => {
            newNumbers.set(pos, i++);
        });

        setNumbers(newNumbers);
        setNextExpected(1);
        setGameState("memorize");
        setShowError(false);
    }, []);

    const startGame = () => {
        setLevel(4); // Start with 4 numbers
        setStrikes(0);
        generateLevel(4);
    };

    const handleTileClick = (index: number) => {
        if (gameState !== "memorize" && gameState !== "playing") return;

        const number = numbers.get(index);
        if (!number) return; // Clicked empty tile

        if (number === 1) {
            // First click always triggers hiding
            setGameState("playing");
        }

        if (number === nextExpected) {
            // Correct
            setNextExpected((n) => n + 1);
            const newNumbers = new Map(numbers);
            newNumbers.delete(index);
            setNumbers(newNumbers);

            if (newNumbers.size === 0) {
                // Level Complete
                setTimeout(() => {
                    setLevel((l) => {
                        const next = l + 1;
                        if (next > 40) return l; // Maxed out
                        generateLevel(next);
                        return next;
                    });
                }, 500);
            }
        } else {
            // Wrong - show error feedback before processing
            setShowError(true);

            // Delay before losing life or ending game
            setTimeout(() => {
                setShowError(false);
                setStrikes((s) => {
                    const newStrikes = s + 1;
                    if (newStrikes >= 3) {
                        setGameState("result");
                        saveResult(level);
                    } else {
                        // Re-roll same level
                        generateLevel(level);
                    }
                    return newStrikes;
                });
            }, 400); // 400ms delay for feedback
        }
    };

    const saveResult = async (score: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameSlug: "chimp-test",
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
            title="Chimp Test"
            description="Are you smarter than a chimpanzee?"
            instructions="Click the squares in numerical order (1, 2, 3...). The numbers will be hidden after you click '1'."
            icon={Grip}
            gameStatus={gameState === "result" ? "result" : "playing"}
            onReset={startGame}
        >
            <div className="flex-grow flex flex-col items-center justify-center min-h-[500px] p-8">
                {gameState !== "idle" && gameState !== "result" && (
                    <div className="flex gap-8 mb-8 text-xl font-bold text-muted-foreground">
                        <div>
                            Score <span className="text-foreground">{level}</span>
                        </div>
                        <div>
                            Strikes <span className="text-foreground">{strikes}/3</span>
                        </div>
                    </div>
                )}

                {gameState === "idle" && (
                    <div className="text-center">
                        <Grip className="w-20 h-20 mx-auto mb-6 text-accent" />
                        <h2 className="text-3xl font-heading font-bold mb-4">Chimp Test</h2>
                        <Button size="lg" onClick={startGame} className="gap-2">
                            <Play className="w-4 h-4" /> Start Game
                        </Button>
                    </div>
                )}

                {(gameState === "memorize" || gameState === "playing") && (
                    <div
                        className="grid gap-2"
                        style={{
                            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                            width: "100%",
                            maxWidth: "600px",
                        }}
                    >
                        {Array.from({ length: ROWS * COLS }).map((_, i) => {
                            const number = numbers.get(i);
                            const showNumber = number !== undefined && gameState === "memorize";
                            const showBlock = number !== undefined && gameState === "playing";
                            const isClickable = number !== undefined;

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleTileClick(i)}
                                    className={cn(
                                        "aspect-square rounded-md flex items-center justify-center text-2xl md:text-3xl font-bold transition-all select-none",
                                        // Numbered tiles (memorize phase) - ORANGE background with white text
                                        showNumber &&
                                        "bg-accent text-white border-2 border-accent shadow-md",
                                        // Hidden tiles (playing phase) - ORANGE solid blocks
                                        showBlock && "bg-accent border-2 border-accent text-transparent",
                                        // Empty/cleared tiles
                                        !showNumber && !showBlock && "opacity-0 pointer-events-none",
                                        // Interaction
                                        isClickable && "cursor-pointer active:scale-95 hover:opacity-90"
                                    )}
                                    disabled={!isClickable}
                                    aria-label={number ? `Number ${number}` : "Empty"}
                                >
                                    {showNumber ? number : ""}
                                </button>
                            );
                        })}
                    </div>
                )}

                {gameState === "result" && (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="mb-2 text-muted-foreground text-lg">Score</div>
                        <div className="text-8xl font-heading font-bold mb-8 text-foreground">
                            {level}
                        </div>
                        <div className="flex flex-col gap-3 justify-center">
                            <Button size="lg" onClick={startGame} className="gap-2 px-8">
                                <RotateCcw className="w-4 h-4" /> Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Error flash feedback */}
            {showError && (
                <div className="absolute inset-0 bg-red-500/20 pointer-events-none animate-in fade-in duration-200" />
            )}
        </GameLayout>
    );
}
