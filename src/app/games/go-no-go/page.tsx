"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameLayout } from "@/components/game-layout";
import { Button } from "@/components/ui/button";
import { PlayCircle, XCircle } from "lucide-react";

type GameState = "idle" | "countdown" | "playing" | "result";
type StimulusType = "go" | "nogo" | null;

interface Trial {
    type: StimulusType;
    response: "correct" | "incorrect" | "timeout" | null;
    rt: number | null;
}

export default function GoNoGoPage() {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [currentStimulus, setCurrentStimulus] = useState<StimulusType>(null);
    const [trials, setTrials] = useState<Trial[]>([]);
    const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [score, setScore] = useState(0);

    const stimulusStartRef = useRef<number>(0);
    const trialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const sequenceRef = useRef<StimulusType[]>([]);

    // Generate trial sequence (60% Go, 40% No-Go)
    const generateSequence = useCallback(() => {
        const sequence: StimulusType[] = [];
        const totalTrials = 25;
        const goTrials = Math.floor(totalTrials * 0.6);

        for (let i = 0; i < goTrials; i++) sequence.push("go");
        for (let i = 0; i < totalTrials - goTrials; i++) sequence.push("nogo");

        // Shuffle
        for (let i = sequence.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
        }

        return sequence;
    }, []);

    const startGame = () => {
        setGameState("countdown");
        setCountdown(3);
        setTrials([]);
        setCurrentTrialIndex(0);
        sequenceRef.current = generateSequence();
    };

    const handleResponse = useCallback(() => {
        if (gameState !== "playing" || !currentStimulus) return;

        const rt = performance.now() - stimulusStartRef.current;
        const trial = sequenceRef.current[currentTrialIndex];

        const isCorrect = trial === "go";
        const newTrial: Trial = {
            type: trial!,
            response: isCorrect ? "correct" : "incorrect",
            rt: isCorrect ? rt : null
        };

        if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);

        setTrials(prev => [...prev, newTrial]);
        setCurrentStimulus(null);
    }, [gameState, currentStimulus, currentTrialIndex]);

    const showNextStimulus = useCallback(() => {
        if (currentTrialIndex >= sequenceRef.current.length) {
            // Game over
            setGameState("result");
            calculateScore();
            return;
        }

        setCurrentStimulus(sequenceRef.current[currentTrialIndex]);
        stimulusStartRef.current = performance.now();

        // Auto-advance after 1.5s (timeout for No-Go is correct, for Go is incorrect)
        trialTimeoutRef.current = setTimeout(() => {
            const trial = sequenceRef.current[currentTrialIndex];
            const newTrial: Trial = {
                type: trial!,
                response: trial === "nogo" ? "correct" : "timeout",
                rt: null
            };
            setTrials(prev => [...prev, newTrial]);
            setCurrentStimulus(null);
        }, 1500);
    }, [currentTrialIndex]);

    const calculateScore = () => {
        const goTrials = trials.filter(t => t.type === "go");
        const nogoTrials = trials.filter(t => t.type === "nogo");

        const goCorrect = goTrials.filter(t => t.response === "correct").length;
        const nogoCorrect = nogoTrials.filter(t => t.response === "correct").length;

        const accuracy = ((goCorrect + nogoCorrect) / trials.length) * 100;

        const validRTs = goTrials.filter(t => t.rt !== null).map(t => t.rt!);
        const meanRT = validRTs.length > 0
            ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length
            : 1000;

        // Weighted score: 70% accuracy, 30% speed
        const finalScore = Math.round((accuracy * 0.7) + ((1000 - meanRT) / 10 * 0.3));
        setScore(Math.max(0, Math.min(100, finalScore)));

        saveResult(finalScore);
    };

    const saveResult = async (finalScore: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                body: JSON.stringify({
                    gameSlug: "go-no-go",
                    score: finalScore,
                    metadata: {
                        trials: trials.length,
                        accuracy: (trials.filter(t => t.response === "correct").length / trials.length) * 100
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
            showNextStimulus();
        }
    }, [gameState, countdown, showNextStimulus]);

    // Trial advancement
    useEffect(() => {
        if (gameState === "playing" && currentStimulus === null && currentTrialIndex < sequenceRef.current.length) {
            const nextDelay = setTimeout(() => {
                setCurrentTrialIndex(prev => prev + 1);
            }, 800);
            return () => clearTimeout(nextDelay);
        }
    }, [gameState, currentStimulus, currentTrialIndex]);

    useEffect(() => {
        if (gameState === "playing" && currentStimulus === null && trials.length > 0 && trials.length === sequenceRef.current.length) {
            // All trials complete
            setGameState("result");
            calculateScore();
        }
    }, [trials, gameState, currentStimulus]);

    // Show next stimulus when index changes
    useEffect(() => {
        if (gameState === "playing" && currentTrialIndex > 0 && currentTrialIndex < sequenceRef.current.length) {
            showNextStimulus();
        }
    }, [currentTrialIndex, gameState, showNextStimulus]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                handleResponse();
            }
        };

        if (gameState === "playing") {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [gameState, handleResponse]);

    return (
        <GameLayout
            title="Go / No-Go Test"
            description="Test your impulse control. Click on green circles, resist clicking on red X's."
            instructions="Click (or press Space) when you see GREEN. Don't click when you see RED."
            icon={PlayCircle}
            gameStatus={gameState === "result" ? "result" : "playing"}
            onReset={startGame}
        >
            <div className="flex-grow flex flex-col items-center justify-center p-8">
                {gameState === "idle" && (
                    <div className="text-center">
                        <PlayCircle className="w-20 h-20 mx-auto mb-6 text-accent animate-pulse" />
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
                    <div className="text-center w-full max-w-md">
                        <div className="mb-6 text-sm text-muted-foreground">
                            Trial {Math.min(currentTrialIndex + 1, sequenceRef.current.length)} / {sequenceRef.current.length}
                        </div>

                        <div
                            className="w-full aspect-square max-w-xs mx-auto flex items-center justify-center mb-8 cursor-pointer"
                            onClick={handleResponse}
                            role="button"
                            tabIndex={0}
                            aria-label={currentStimulus === "go" ? "Go stimulus - click now" : currentStimulus === "nogo" ? "No-Go stimulus - do not click" : "Waiting"}
                        >
                            {currentStimulus === "go" && (
                                <div className="w-48 h-48 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                                    <div className="text-white text-6xl">●</div>
                                </div>
                            )}
                            {currentStimulus === "nogo" && (
                                <div className="w-48 h-48 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                                    <XCircle className="w-32 h-32 text-white" />
                                </div>
                            )}
                            {!currentStimulus && (
                                <div className="w-48 h-48 rounded-full bg-muted"></div>
                            )}
                        </div>
                    </div>
                )}

                {gameState === "result" && (
                    <div className="text-center">
                        <div className="text-7xl font-heading font-bold mb-4 text-foreground">
                            {score}
                        </div>
                        <p className="text-muted-foreground mb-2">Impulse Control Score</p>
                        <p className="text-sm text-muted-foreground mb-8">
                            {trials.filter(t => t.response === "correct").length}/{trials.length} correct
                        </p>
                        <Button size="lg" onClick={startGame}>Play Again</Button>
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
