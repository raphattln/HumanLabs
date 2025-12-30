"use client";

import { useState, useEffect, useCallback } from "react";
import { GameLayout } from "@/components/game-layout";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

type GameState = "idle" | "countdown" | "playing" | "result";

interface Trial {
    word: string;
    color: string;
    userAnswer: string | null;
    correct: boolean;
    rt: number;
}

const COLORS = [
    { name: "RED", hex: "#DC2626", label: "Red" },
    { name: "BLUE", hex: "#2563EB", label: "Blue" },
    { name: "GREEN", hex: "#16A34A", label: "Green" },
    { name: "YELLOW", hex: "#CA8A04", label: "Yellow" }
];

export default function StroopTestPage() {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [trials, setTrials] = useState<Trial[]>([]);
    const [currentWord, setCurrentWord] = useState("");
    const [currentColor, setCurrentColor] = useState("");
    const [countdown, setCountdown] = useState(3);
    const [trialStart, setTrialStart] = useState(0);
    const [score, setScore] = useState(0);

    const totalTrials = 20;

    const generateTrial = useCallback(() => {
        const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const inkColor = COLORS[Math.floor(Math.random() * COLORS.length)];

        setCurrentWord(wordColor.name);
        setCurrentColor(inkColor.name);
        setTrialStart(performance.now());
    }, []);

    const startGame = () => {
        setGameState("countdown");
        setCountdown(3);
        setTrials([]);
    };

    const handleColorChoice = useCallback((chosenColor: string) => {
        if (gameState !== "playing") return;

        const rt = performance.now() - trialStart;
        const correct = chosenColor === currentColor;

        const newTrial: Trial = {
            word: currentWord,
            color: currentColor,
            userAnswer: chosenColor,
            correct,
            rt
        };

        const updatedTrials = [...trials, newTrial];
        setTrials(updatedTrials);

        if (updatedTrials.length >= totalTrials) {
            // Game complete
            setGameState("result");
            calculateScore(updatedTrials);
        } else {
            // Next trial
            setTimeout(() => generateTrial(), 500);
        }
    }, [gameState, currentColor, currentWord, trialStart, trials, generateTrial]);

    const calculateScore = (completedTrials: Trial[]) => {
        const correctCount = completedTrials.filter(t => t.correct).length;
        const accuracy = (correctCount / completedTrials.length) * 100;

        const avgRT = completedTrials.reduce((sum, t) => sum + t.rt, 0) / completedTrials.length;

        // Score = accuracy weighted heavily, minus RT penalty
        const finalScore = Math.round(accuracy - (avgRT / 20));
        setScore(Math.max(0, Math.min(100, finalScore)));

        saveResult(finalScore);
    };

    const saveResult = async (finalScore: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                body: JSON.stringify({
                    gameSlug: "stroop-test",
                    score: finalScore,
                    metadata: {
                        trials: trials.length,
                        accuracy: (trials.filter(t => t.correct).length / trials.length) * 100
                    },
                }),
            });
        } catch (error) {
            console.error("Failed to save result", error);
        }
    };

    // Countdown effect
    useEffect(() => {
        if (gameState === "countdown" && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (gameState === "countdown" && countdown === 0) {
            setGameState("playing");
            generateTrial();
        }
    }, [gameState, countdown, generateTrial]);

    // Keyboard support (1-4 for colors)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState === "playing") {
                const key = e.key;
                if (key === "1") handleColorChoice("RED");
                else if (key === "2") handleColorChoice("BLUE");
                else if (key === "3") handleColorChoice("GREEN");
                else if (key === "4") handleColorChoice("YELLOW");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [gameState, handleColorChoice]);

    const getColorHex = (colorName: string) => {
        return COLORS.find(c => c.name === colorName)?.hex || "#000";
    };

    return (
        <GameLayout
            title="Stroop Test"
            description="Name the ink color, not the word. Sounds simple, but your brain will fight you."
            instructions="Click the color of the INK, not what the word says. Use 1-2-3-4 keys or click."
            icon={Palette}
            gameStatus={gameState === "result" ? "result" : "playing"}
            onReset={startGame}
        >
            <div className="flex-grow flex flex-col items-center justify-center p-8">
                {gameState === "idle" && (
                    <div className="text-center">
                        <Palette className="w-20 h-20 mx-auto mb-6 text-accent animate-pulse" />
                        <Button size="lg" onClick={startGame}>Start Test</Button>
                    </div>
                )}

                {gameState === "countdown" && (
                    <div className="text-center">
                        <div className="text-8xl font-heading font-bold text-accent mb-4">{countdown}</div>
                        <p className="text-muted-foreground">Get ready...</p>
                    </div>
                )}

                {gameState === "playing" && (
                    <div className="text-center w-full max-w-2xl">
                        <div className="mb-8 text-sm text-muted-foreground">
                            {trials.length + 1} / {totalTrials}
                        </div>

                        {/* Word Display */}
                        <div className="mb-12">
                            <div
                                className="text-8xl font-heading font-bold"
                                style={{ color: getColorHex(currentColor) }}
                                aria-label={`Word: ${currentWord}, Ink color: ${currentColor}`}
                            >
                                {currentWord}
                            </div>
                        </div>

                        {/* Color Buttons */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {COLORS.map((color, index) => (
                                <button
                                    key={color.name}
                                    onClick={() => handleColorChoice(color.name)}
                                    className="p-6 rounded-2xl font-bold text-white text-lg transition-transform hover:scale-105 focus-ring"
                                    style={{ backgroundColor: color.hex }}
                                    aria-label={`${color.label} (Press ${index + 1})`}
                                >
                                    {color.label}
                                    <div className="text-xs opacity-75 mt-1">{index + 1}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === "result" && (
                    <div className="text-center">
                        <div className="text-7xl font-heading font-bold mb-4 text-foreground">
                            {score}
                        </div>
                        <p className="text-muted-foreground mb-2">Interference Resistance</p>
                        <p className="text-sm text-muted-foreground mb-8">
                            {trials.filter(t => t.correct).length}/{trials.length} correct
                        </p>
                        <Button size="lg" onClick={startGame}>Play Again</Button>
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
