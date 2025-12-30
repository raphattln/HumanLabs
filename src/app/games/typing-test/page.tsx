"use client";

import { useState, useRef, useEffect } from "react";
import { GameLayout } from "@/components/game-layout";
import { Keyboard, RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GameState = "idle" | "difficulty" | "playing" | "result";
type Difficulty = "brainroot" | "medium" | "genius";

// Word pools for different difficulties
const WORD_POOLS = {
    brainroot: [
        "the", "and", "you", "that", "was", "for", "are", "with", "his", "they",
        "have", "this", "from", "one", "had", "not", "but", "what", "all", "were",
        "when", "your", "can", "said", "there", "use", "each", "which", "she",
        "how", "their", "will", "other", "about", "out", "many", "then", "them",
        "some", "her", "would", "make", "like", "him", "into", "time", "has",
        "look", "two", "more", "write", "see", "number", "way", "could", "people",
    ],
    medium: [
        "through", "because", "between", "important", "different", "thought",
        "question", "answer", "problem", "suggest", "actually", "continue",
        "develop", "experience", "government", "individual", "necessary",
        "possible", "remember", "something", "understand", "available",
        "beautiful", "community", "education", "environment", "information",
        "interesting", "knowledge", "language", "mountain", "opportunity",
        "organization", "particular", "performance", "perspective", "relationship",
        "significant", "situation", "structure", "technology", "traditional",
    ],
    genius: [
        "accommodation", "acknowledge", "ambiguous", "ameliorate", "benevolent",
        "bureaucracy", "capitulate", "coincidence", "collaborate", "comprehensive",
        "conscientious", "demonstrate", "deteriorate", "differentiate", "diligent",
        "efficiency", "emphasize", "entrepreneur", "exceptional", "fundamental",
        "hypothesis", "implementation", "infrastructure", "interpretation",
        "jurisdiction", "legitimate", "magnificent", "manipulation", "metaphorical",
        "negotiation", "nevertheless", "observatory", "overwhelming", "paradoxical",
        "pharmaceutical", "philosophical", "predominantly", "psychological",
        "questionnaire", "revolutionary", "sophisticated", "substantial",
        "systematically", "tremendously", "underestimate", "unprecedented",
    ],
};

const TEST_DURATION = 60; // 60 seconds

export default function TypingTestPage() {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("medium");
    const [text, setText] = useState("");
    const [input, setInput] = useState("");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(TEST_DURATION);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Generate random text from word pool
    const generateText = (diff: Difficulty, wordCount = 150) => {
        const pool = WORD_POOLS[diff];
        const words = [];
        for (let i = 0; i < wordCount; i++) {
            words.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        return words.join(" ") + " "; // Add trailing space
    };

    const selectDifficulty = (diff: Difficulty) => {
        setDifficulty(diff);
        setGameState("difficulty");
    };

    const startGame = () => {
        const initialText = generateText(difficulty);
        setText(initialText);
        setInput("");
        setStartTime(null);
        setTimeRemaining(TEST_DURATION);
        setWpm(0);
        setAccuracy(100);
        setGameState("playing");

        // Focus input after render
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const finishGame = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Calculate final WPM and accuracy
        const timeMinutes = (TEST_DURATION - timeRemaining) / 60;
        const typedWords = input.trim().split(/\s+/).length;
        const finalWpm = Math.round(typedWords / Math.max(timeMinutes, 0.01));

        // Calculate accuracy
        let correctChars = 0;
        const minLength = Math.min(input.length, text.length);
        for (let i = 0; i < minLength; i++) {
            if (input[i] === text[i]) correctChars++;
        }
        const acc = Math.round((correctChars / Math.max(input.length, 1)) * 100);

        setWpm(finalWpm);
        setAccuracy(acc);
        setGameState("result");
        saveResult(finalWpm);
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;

        if (gameState !== "playing") return;

        // Start timer on first character
        if (!startTime && val.length > 0) {
            setStartTime(performance.now());

            // Start 60-second countdown
            timerRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        finishGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        setInput(val);

        // Dynamic text extension - if user is getting close to the end, add more
        if (val.length > text.length * 0.7) {
            const newText = generateText(difficulty, 50);
            setText((prev) => prev + newText);
        }

        // Real-time WPM calculation
        if (startTime) {
            const elapsed = (performance.now() - startTime) / 60000; // minutes
            const typedWords = val.trim().split(/\s+/).length;
            const currentWpm = Math.round(typedWords / Math.max(elapsed, 0.01));
            setWpm(currentWpm);
        }

        // Real-time accuracy
        let correctChars = 0;
        for (let i = 0; i < val.length; i++) {
            if (val[i] === text[i]) correctChars++;
        }
        const acc = Math.round((correctChars / Math.max(val.length, 1)) * 100);
        setAccuracy(acc);
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const saveResult = async (score: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameSlug: "typing-test",
                    score,
                    metadata: { wpm: score, accuracy, difficulty },
                }),
            });
        } catch (error) {
            console.error("Failed to save result", error);
        }
    };

    const handleContainerClick = () => {
        if (gameState === "playing") inputRef.current?.focus();
    };

    const resetToStart = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setGameState("idle");
    };

    return (
        <GameLayout
            title="Typing Test"
            description="How fast can you type? Test your typing speed and accuracy."
            instructions="Choose difficulty, then type the text as shown. 60 seconds to type as much as you can!"
            icon={Keyboard}
            gameStatus={gameState === "result" ? "result" : "playing"}
            onReset={resetToStart}
        >
            <div
                className="flex-grow flex flex-col items-center justify-center min-h-[500px] p-4 sm:p-8"
                onClick={handleContainerClick}
            >
                {/* Idle State - Level selector */}
                {gameState === "idle" && (
                    <div className="text-center max-w-2xl">
                        <Keyboard className="w-20 h-20 mx-auto mb-6 text-accent" />
                        <h2 className="text-3xl font-heading font-bold mb-2">Typing Test</h2>
                        <p className="text-muted-foreground mb-8">
                            Choose your difficulty level
                        </p>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <button
                                onClick={() => {
                                    selectDifficulty("brainroot");
                                    startGame();
                                }}
                                className="group p-6 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border-2 border-transparent hover:border-accent"
                            >
                                <div className="text-2xl font-bold mb-2">🌱 Brainroot</div>
                                <div className="text-sm text-muted-foreground">
                                    Simple words
                                    <br />
                                    Short sentences
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    selectDifficulty("medium");
                                    startGame();
                                }}
                                className="group p-6 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border-2 border-transparent hover:border-accent"
                            >
                                <div className="text-2xl font-bold mb-2">⚡ Medium</div>
                                <div className="text-sm text-muted-foreground">
                                    Standard vocabulary
                                    <br />
                                    Mixed sentences
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    selectDifficulty("genius");
                                    startGame();
                                }}
                                className="group p-6 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border-2 border-transparent hover:border-accent"
                            >
                                <div className="text-2xl font-bold mb-2">🧠 Genius</div>
                                <div className="text-sm text-muted-foreground">
                                    Complex vocabulary
                                    <br />
                                    Longer words
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Playing State */}
                {gameState === "playing" && (
                    <div className="w-full max-w-4xl">
                        {/* Stats header */}
                        <div className="flex justify-between items-center mb-6 text-xl font-bold">
                            <div className="text-muted-foreground">
                                Time: <span className="text-foreground">{timeRemaining}s</span>
                            </div>
                            <div className="text-muted-foreground">
                                WPM: <span className="text-accent">{wpm}</span>
                            </div>
                            <div className="text-muted-foreground">
                                Accuracy: <span className="text-foreground">{accuracy}%</span>
                            </div>
                        </div>

                        {/* Hidden input */}
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInput}
                            className="absolute opacity-0 pointer-events-none"
                            aria-label="Typing input"
                            autoComplete="off"
                            spellCheck="false"
                        />

                        {/* Text display */}
                        <div className="bg-muted/30 p-6 sm:p-8 rounded-xl text-xl sm:text-2xl font-mono leading-relaxed break-words whitespace-pre-wrap select-none cursor-text border-2 border-accent/50">
                            {text.split("").map((char, i) => {
                                const typed = input[i];
                                let colorClass = "text-muted-foreground";

                                if (typed !== undefined) {
                                    if (typed === char) {
                                        colorClass = "text-foreground";
                                    } else {
                                        colorClass = "text-red-500 bg-red-100 dark:bg-red-900/30";
                                    }
                                }

                                const isCursor = i === input.length;

                                return (
                                    <span key={i} className={cn(colorClass, "relative")}>
                                        {isCursor && (
                                            <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-accent animate-pulse" />
                                        )}
                                        {char}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Result State */}
                {gameState === "result" && (
                    <div className="text-center animate-in fade-in zoom-in duration-300 bg-card p-8 rounded-2xl shadow-sm border border-border max-w-2xl">
                        <div className="mb-6 text-sm text-muted-foreground uppercase tracking-wider">
                            Difficulty: <span className="font-bold">{difficulty}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-8 sm:gap-12 mb-8">
                            <div>
                                <div className="text-sm uppercase tracking-widest text-muted-foreground font-bold mb-2">
                                    WPM
                                </div>
                                <div className="text-6xl sm:text-7xl font-heading font-bold text-accent">
                                    {wpm}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm uppercase tracking-widest text-muted-foreground font-bold mb-2">
                                    Accuracy
                                </div>
                                <div className="text-6xl sm:text-7xl font-heading font-bold text-foreground">
                                    {accuracy}%
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 justify-center">
                            <Button size="lg" onClick={resetToStart} className="gap-2 px-8">
                                <RotateCcw className="w-4 h-4" /> Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
