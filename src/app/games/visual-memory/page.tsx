"use client";

import { useState, useEffect, useCallback } from "react";
import { GameLayout } from "@/components/game-layout";
import { Brain, RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GameState = "idle" | "memorize" | "recall" | "result";

export default function VisualMemoryPage() {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [gridSize, setGridSize] = useState(3); // 3x3 initially
    // Set of indices that are active targets
    const [targets, setTargets] = useState<Set<number>>(new Set());
    // Set of indices the user has correctly clicked
    const [selected, setSelected] = useState<Set<number>>(new Set());
    // Set of indices the user clicked WRONG
    const [mistakes, setMistakes] = useState<Set<number>>(new Set());

    const generateLevel = useCallback((lvl: number) => {
        // Difficulty scaling
        // Level 1: 3 targets, 3x3
        // Level 3: 4 targets...
        // Simple heuristic: targets = 2 + lvl
        // Grid size: needs to fit targets comfortably.
        // if targets > 5 -> 4x4
        // if targets > 8 -> 5x5
        // if targets > 14 -> 6x6

        let numTargets = 2 + lvl;
        let size = 3;
        if (numTargets >= 5) size = 4;
        if (numTargets >= 9) size = 5;
        if (numTargets >= 15) size = 6;
        if (numTargets >= 20) size = 7;

        setGridSize(size);

        const newTargets = new Set<number>();
        while (newTargets.size < numTargets) {
            newTargets.add(Math.floor(Math.random() * (size * size)));
        }
        setTargets(newTargets);
        setSelected(new Set());
        setMistakes(new Set());
        setGameState("memorize");

        // Display time usually: 1s + 0.5s per target? Or fixed?
        // Let's do 1.5s base + nice fade.
        setTimeout(() => {
            setGameState("recall");
        }, 1000 + (numTargets * 200)); // Longer for harder levels
    }, []);

    const startGame = () => {
        setLevel(1);
        setLives(3);
        generateLevel(1);
    };

    const handleTileClick = (index: number) => {
        if (gameState !== "recall") return;
        if (selected.has(index) || mistakes.has(index)) return; // Already clicked

        if (targets.has(index)) {
            // Correct
            const newSelected = new Set(selected);
            newSelected.add(index);
            setSelected(newSelected);

            if (newSelected.size === targets.size) {
                // Level complete
                setGameState("idle"); // visual pause
                setTimeout(() => {
                    setLevel(l => {
                        const next = l + 1;
                        generateLevel(next);
                        return next;
                    });
                }, 500);
            }
        } else {
            // Incorrect
            const newMistakes = new Set(mistakes);
            newMistakes.add(index);
            setMistakes(newMistakes);

            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    setGameState("result");
                    saveResult(level);
                }
                return newLives;
            });

            // If checking "strike system" - standard HumanBenchmark:
            // 3 strikes (lives) per game? Or per level?
            // Usually 3 strikes total.
            // But if you fail to find all... do you retry the level?
            // HumanBenchmark: If you clear it, you go up. If you miss 3 tiles?
            // "3 strikes" usually means 3 wrong clicks allowed per run? 
            // Or 3 failed LEVELS?
            // Let's stick to: 3 lives global.
        }
    };

    const saveResult = async (score: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                body: JSON.stringify({
                    gameSlug: "visual-memory",
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
            title="Visual Memory"
            description="Memorize the squares that light up."
            instructions="The squares will flash white. Memorize their positions and click them when they disappear."
            icon={Brain}
            gameStatus={gameState === "result" ? "result" : "playing"}
            onReset={startGame}
        >
            <div className="flex-grow flex flex-col items-center justify-center min-h-[500px] p-8">

                {/* HUD */}
                {gameState !== "idle" && gameState !== "result" && (
                    <div className="flex gap-8 mb-8 text-xl font-bold text-muted-foreground">
                        <div>Level <span className="text-foreground">{level}</span></div>
                        <div>Lives <span className="text-foreground">{lives}</span></div>
                    </div>
                )}

                {gameState === "idle" && targets.size === 0 && (
                    <div className="text-center">
                        <Brain className="w-20 h-20 mx-auto mb-6 text-accent" />
                        <h2 className="text-3xl font-heading font-bold mb-4">Visual Memory</h2>
                        <Button size="lg" onClick={startGame} className="gap-2">
                            <Play className="w-4 h-4" /> Start Game
                        </Button>
                    </div>
                )}

                {(gameState === "memorize" || gameState === "recall") && (
                    <div
                        className="grid gap-2 transition-all duration-300"
                        style={{
                            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                            width: `${Math.min(gridSize * 80, 500)}px`
                        }}
                    >
                        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                            const isTarget = targets.has(i);
                            const isSelected = selected.has(i);
                            const isMistake = mistakes.has(i);

                            // Visual State
                            let bgClass = "bg-muted/40 cursor-pointer hover:bg-muted/60";

                            if (gameState === "memorize") {
                                if (isTarget) bgClass = "bg-foreground scale-105 shadow-lg"; // Show target
                                else bgClass = "bg-muted/40"; // Normal
                            }

                            if (gameState === "recall") {
                                if (isSelected) bgClass = "bg-foreground scale-95"; // Found it
                                else if (isMistake) bgClass = "bg-red-500/50 scale-90"; // Missed
                                else if (isTarget && lives === 0) bgClass = "bg-accent/50"; // Reveal on loss
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleTileClick(i)}
                                    // Use style explicitly for aspect ratio to ensure square tiles
                                    className={cn(
                                        "aspect-square rounded-lg transition-all duration-200",
                                        bgClass,
                                        gameState === "memorize" && "cursor-default"
                                    )}
                                    disabled={gameState !== "recall"}
                                    aria-label={`Tile ${i}`}
                                />
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
        </GameLayout>
    );
}
