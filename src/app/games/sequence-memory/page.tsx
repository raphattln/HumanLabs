"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameLayout } from "@/components/game-layout";
import { Boxes, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type GameState = "idle" | "displaying" | "input" | "result";

const FLASH_DURATION = 450; // ms
const GAP_DURATION = 150; // ms

export default function SequenceMemoryPage() {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [level, setLevel] = useState(1);
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const [showingError, setShowingError] = useState(false);

    // Refs to avoid stale closures
    const sequenceRef = useRef<number[]>([]);
    const isPlayingRef = useRef(false);
    const cleanupRef = useRef<(() => void) | null>(null);

    const startGame = useCallback(() => {
        // Cleanup any existing playback
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }

        const initialSequence = [Math.floor(Math.random() * 9)];
        setSequence(initialSequence);
        sequenceRef.current = initialSequence;
        setLevel(1);
        setUserSequence([]);
        setShowingError(false);
        setActiveTile(null);
        isPlayingRef.current = false;
        setGameState("displaying");
    }, []);

    // Deterministic playback using async/await
    const playSequence = useCallback(async () => {
        console.log("=== PLAYBACK START ===");
        console.log("Sequence to play:", sequenceRef.current);
        console.log("Sequence length:", sequenceRef.current.length);

        setUserSequence([]);
        setActiveTile(null);
        isPlayingRef.current = true;

        let cancelled = false;
        cleanupRef.current = () => {
            cancelled = true;
            setActiveTile(null);
        };

        // Initial delay before starting
        await new Promise((r) => setTimeout(r, 600));
        if (cancelled) return;

        // Play each tile in sequence
        for (let i = 0; i < sequenceRef.current.length; i++) {
            if (cancelled) break;

            const tileIndex = sequenceRef.current[i];
            console.log(`Playing tile ${i + 1}/${sequenceRef.current.length}: tile #${tileIndex}`);

            // Show highlight
            setActiveTile(tileIndex);

            // Keep visible for FLASH_DURATION
            await new Promise((r) => setTimeout(r, FLASH_DURATION));
            if (cancelled) break;

            // Clear highlight
            setActiveTile(null);

            // Gap before next tile (but not after last tile)
            if (i < sequenceRef.current.length - 1) {
                await new Promise((r) => setTimeout(r, GAP_DURATION));
                if (cancelled) break;
            }
        }

        if (!cancelled) {
            console.log("=== PLAYBACK COMPLETE ===");
            // Small delay before enabling input
            await new Promise((r) => setTimeout(r, 400));
            if (!cancelled) {
                isPlayingRef.current = false;
                setGameState("input");
            }
        }
    }, []);

    // Trigger playback when entering displaying state
    useEffect(() => {
        if (gameState === "displaying" && !isPlayingRef.current) {
            playSequence();
        }
    }, [gameState, playSequence]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, []);

    const handleTileClick = async (index: number) => {
        // Strictly prevent input during playback
        if (gameState !== "input") return;

        // User input feedback - ALWAYS show orange flash (200ms)
        // This happens regardless of whether the click is correct or incorrect
        setActiveTile(index);

        // Clear highlight after 200ms
        const flashTimeout = setTimeout(() => {
            setActiveTile(null);
        }, 200);

        const expectedIndex = sequence[userSequence.length];

        if (index === expectedIndex) {
            // Correct click
            const newUserSequence = [...userSequence, index];
            setUserSequence(newUserSequence);

            if (newUserSequence.length === sequence.length) {
                // User passed level - advance
                setGameState("displaying");

                setTimeout(() => {
                    const nextLevel = level + 1;
                    const newSequence = [...sequence, Math.floor(Math.random() * 9)];
                    setLevel(nextLevel);
                    setSequence(newSequence);
                    sequenceRef.current = newSequence;
                }, 600);
            }
        } else {
            // Wrong tile - still showed orange flash, now show error
            // Wait for flash to complete before transitioning
            setTimeout(() => {
                setShowingError(true);
                setGameState("result");
                saveResult(level - 1);
            }, 250); // Slight delay to let user see the flash before error
        }
    };

    const saveResult = async (score: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameSlug: "sequence-memory",
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
            title="Sequence Memory"
            description="Memorize the pattern. It gets one step longer every round."
            instructions="Watch the tiles flash. Repeat the pattern by clicking the same tiles in the same order."
            icon={Boxes}
            gameStatus={gameState === "result" ? "result" : "playing"}
            onReset={startGame}
        >
            <div className="flex-grow flex flex-col items-center justify-center min-h-[500px] p-8">
                {gameState === "idle" && (
                    <div className="text-center">
                        <Boxes className="w-20 h-20 mx-auto mb-6 text-accent" />
                        <h2 className="text-3xl font-heading font-bold mb-4">Sequence Memory</h2>
                        <Button size="lg" onClick={startGame} className="gap-2">
                            <Play className="w-4 h-4" /> Start Game
                        </Button>
                    </div>
                )}

                {(gameState === "displaying" || gameState === "input") && (
                    <div className="flex flex-col items-center gap-8">
                        <div className="text-2xl font-bold text-muted-foreground">
                            Level {level}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleTileClick(i)}
                                    disabled={gameState !== "input"}
                                    className={cn(
                                        "w-24 h-24 sm:w-32 sm:h-32 rounded-xl transition-all duration-150",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                                        // Default state
                                        activeTile !== i && "bg-muted/40",
                                        // Active (highlighted) state - ORANGE GLOW
                                        activeTile === i &&
                                        "bg-accent shadow-[0_0_40px_rgba(238,108,77,0.8)] scale-110 z-10",
                                        // Interaction states (only during input phase)
                                        gameState === "input" &&
                                        "cursor-pointer hover:bg-muted/60 active:scale-95",
                                        gameState === "displaying" && "cursor-default"
                                    )}
                                    aria-label={`Tile ${i + 1}`}
                                    aria-disabled={gameState !== "input"}
                                />
                            ))}
                        </div>
                        <div className="h-6 text-sm text-muted-foreground font-medium">
                            {gameState === "displaying"
                                ? "Watch the sequence..."
                                : "Your turn - repeat it!"}
                        </div>
                    </div>
                )}

                {gameState === "result" && (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="mb-2 text-muted-foreground text-lg">Level Reached</div>
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

            {/* Background flash for error */}
            {showingError && (
                <div className="absolute inset-0 bg-red-500/20 pointer-events-none animate-in fade-in duration-200" />
            )}
        </GameLayout>
    );
}
