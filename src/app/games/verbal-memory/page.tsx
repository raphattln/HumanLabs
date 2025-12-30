"use client";

import { useState } from "react";
import { GameLayout } from "@/components/game-layout";
import { Languages, RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

// Small dictionary for demo purposes. In production this could be larger or fetched.
const WORD_LIST = [
    "house", "train", "apple", "music", "table", "chair", "plant", "water", "light", "space",
    "cloud", "dream", "earth", "river", "stone", "beach", "night", "smile", "heart", "paper",
    "bread", "clock", "glass", "grass", "horse", "money", "movie", "ocean", "party", "phone",
    "power", "radio", "shirt", "shoes", "skirt", "smile", "sound", "spoon", "sugar", "tiger",
    "woman", "world", "write", "youth", "zebra", "happy", "drink", "drive", "field", "fight",
    "frame", "fruit", "group", "guide", "hotel", "image", "knife", "large", "magic", "metal"
];

type GameState = "idle" | "playing" | "result";

export default function VerbalMemoryPage() {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [currentWord, setCurrentWord] = useState("");
    const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
    // Words seen in this current round. 
    // Wait, the logic is: "Has this word appeared YET in this game?"
    // So we need a pool of "potential words".

    // Logic:
    // 50% chance to show a SEEN word (from seenWords Set).
    // 50% chance to show a NEW word (from WORD_LIST not in seenWords).

    const nextTurn = (currentSeenSet: Set<string>, currentScore: number) => {
        // Decide: New or Seen?
        // If seenSet is empty, must be New.
        const canShowSeen = currentSeenSet.size > 0;
        const showSeen = canShowSeen && Math.random() > 0.6; // 40% chance for NEW, 60% for SEEN to keep memory fresh? Or 50/50.

        let word = "";

        if (showSeen) {
            // Pick random word from seen
            const seenArray = Array.from(currentSeenSet);
            word = seenArray[Math.floor(Math.random() * seenArray.length)];
        } else {
            // Pick random NEW word
            // Naive approach: random pick until not in set.
            // Better: Filter first? List is small so filter works.
            const available = WORD_LIST.filter(w => !currentSeenSet.has(w));
            if (available.length === 0) {
                // Exhausted dictionary. Just show seen or reset? 
                // For demo, we just loop or end. Let's restart dictionary logic virtually (allow duplicates logic handles this).
                // Actually if available is 0, we MUST show seen.
                const seenArray = Array.from(currentSeenSet);
                word = seenArray[Math.floor(Math.random() * seenArray.length)];
            } else {
                word = available[Math.floor(Math.random() * available.length)];
            }
        }

        setCurrentWord(word);
    };

    const startGame = () => {
        setScore(0);
        setLives(3);
        setSeenWords(new Set());
        setGameState("playing");

        // Initial word must be new
        const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
        setCurrentWord(word);
        // Note: we don't add to seenWords YET. We add it after the user guesses (or as soon as it is shown? Usually "seen" means shown).
        // Standard logic: It IS shown now. So if it appears NEXT time, it is SEEN.
        // Wait. User must decide "Have I seen this BEFORE NOW?".
        // So for the FIRST word, the answer involves checking if it was seen PREVIOUSLY.
        // For the *first* turn, "SEEN" is impossible.
    };

    // We need to know if the CURRENT word WAS in the set BEFORE this turn started.
    // So we need to track if `currentWord` is in `seenWords`.

    const handleChoice = (choice: "SEEN" | "NEW") => {
        const isActuallySeen = seenWords.has(currentWord);
        const correct = (choice === "SEEN" && isActuallySeen) || (choice === "NEW" && !isActuallySeen);

        if (correct) {
            setScore(s => s + 1);

            // If it was NEW, now it is SEEN.
            const newSeen = new Set(seenWords);
            newSeen.add(currentWord);
            setSeenWords(newSeen);

            nextTurn(newSeen, score + 1);
        } else {
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    setGameState("result");
                    saveResult(score);
                } else {
                    // Even if wrong, it is now SEEN.
                    const newSeen = new Set(seenWords);
                    newSeen.add(currentWord);
                    setSeenWords(newSeen);
                    nextTurn(newSeen, score);
                }
                return newLives;
            });
        }
    };

    const saveResult = async (score: number) => {
        try {
            await fetch("/api/results", {
                method: "POST",
                body: JSON.stringify({
                    gameSlug: "verbal-memory",
                    score,
                    metadata: { words: score },
                }),
            });
        } catch (error) {
            console.error("Failed to save result", error);
        }
    };

    return (
        <GameLayout
            title="Verbal Memory"
            description="You will be shown a series of words. If you've seen the word before, click SEEN. If it's a new word, click NEW."
            instructions="Keep the words in your distinct memory bank."
            icon={Languages}
            gameStatus={gameState === "result" ? "result" : "playing"}
            onReset={startGame}
        >
            <div className="flex-grow flex flex-col items-center justify-center min-h-[500px] p-8">

                {gameState !== "idle" && gameState !== "result" && (
                    <div className="flex gap-8 mb-8 text-xl font-bold text-muted-foreground">
                        <div>Score <span className="text-foreground">{score}</span></div>
                        <div>Lives <span className="text-foreground">{lives}</span></div>
                    </div>
                )}

                {gameState === "idle" && (
                    <div className="text-center">
                        <Languages className="w-20 h-20 mx-auto mb-6 text-accent" />
                        <h2 className="text-3xl font-heading font-bold mb-4">Verbal Memory</h2>
                        <Button size="lg" onClick={startGame} className="gap-2">
                            <Play className="w-4 h-4" /> Start Game
                        </Button>
                    </div>
                )}

                {gameState === "playing" && (
                    <div className="text-center w-full max-w-lg">
                        <div className="text-5xl md:text-7xl font-bold font-heading mb-12">
                            {currentWord}
                        </div>
                        <div className="flex gap-4 justify-center">
                            <Button size="lg" onClick={() => handleChoice("SEEN")} variant="secondary" className="w-40 bg-accent text-white hover:bg-accent/90 h-16 text-xl">
                                SEEN
                            </Button>
                            <Button size="lg" onClick={() => handleChoice("NEW")} variant="secondary" className="w-40 bg-foreground text-background hover:bg-foreground/90 h-16 text-xl">
                                NEW
                            </Button>
                        </div>
                    </div>
                )}

                {gameState === "result" && (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="mb-2 text-muted-foreground text-lg">Verbal Score</div>
                        <div className="text-8xl font-heading font-bold mb-8 text-foreground">
                            {score}
                        </div>
                        <div className="text-xl mb-8">
                            Unique words: <span className="font-bold">{seenWords.size}</span>
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
