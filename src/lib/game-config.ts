export type ScoreDirection = "HIGHER_BETTER" | "LOWER_BETTER";

export interface GameConfig {
    slug: string;
    name: string;
    description: string;
    scoreDirection: ScoreDirection;
    scoreUnit?: string; // e.g., "ms", "words", "level"
}

export const GAMES: Record<string, GameConfig> = {
    "reaction-time": {
        slug: "reaction-time",
        name: "Reaction Time",
        description: "Test your visual reflexes",
        scoreDirection: "LOWER_BETTER",
        scoreUnit: "ms",
    },
    "aim-trainer": {
        slug: "aim-trainer",
        name: "Aim Trainer",
        description: "Click targets as fast as possible",
        scoreDirection: "LOWER_BETTER",
        scoreUnit: "ms",
    },
    "sequence-memory": {
        slug: "sequence-memory",
        name: "Sequence Memory",
        description: "Remember increasingly long patterns",
        scoreDirection: "HIGHER_BETTER",
        scoreUnit: "level",
    },
    "visual-memory": {
        slug: "visual-memory",
        name: "Visual Memory",
        description: "Remember the positions of squares",
        scoreDirection: "HIGHER_BETTER",
        scoreUnit: "level",
    },
    "number-memory": {
        slug: "number-memory",
        name: "Number Memory",
        description: "Memorize the longest number",
        scoreDirection: "HIGHER_BETTER",
        scoreUnit: "digits",
    },
    "verbal-memory": {
        slug: "verbal-memory",
        name: "Verbal Memory",
        description: "Keep as many words in memory as possible",
        scoreDirection: "HIGHER_BETTER",
        scoreUnit: "score",
    },
    "chimp-test": {
        slug: "chimp-test",
        name: "Chimp Test",
        description: "Test your working memory",
        scoreDirection: "HIGHER_BETTER",
        scoreUnit: "numbers",
    },
    "typing-test": {
        slug: "typing-test",
        name: "Typing Test",
        description: "How many words per minute?",
        scoreDirection: "HIGHER_BETTER",
        scoreUnit: "wpm",
    },
    "go-no-go": {
        slug: "go-no-go",
        name: "Go / No-Go",
        description: "Test your impulse control",
        scoreDirection: "HIGHER_BETTER",
        scoreUnit: "score",
    },
    "stroop-test": {
        slug: "stroop-test",
        name: "Stroop Test",
        description: "Test your attention control",
        scoreDirection: "HIGHER_BETTER",
        scoreUnit: "score",
    },
    "time-estimation": {
        slug: "time-estimation",
        name: "Time Estimation",
        description: "How accurate is your internal clock?",
        scoreDirection: "HIGHER_BETTER",
        scoreUnit: "score",
    },
};

export function getGameConfig(slug: string): GameConfig | undefined {
    return GAMES[slug];
}

export function getAllGames(): GameConfig[] {
    return Object.values(GAMES);
}

export function isBetterScore(
    newScore: number,
    currentBest: number,
    direction: ScoreDirection
): boolean {
    if (direction === "HIGHER_BETTER") {
        return newScore > currentBest;
    } else {
        return newScore < currentBest;
    }
}

export function getBestScore(
    scores: number[],
    direction: ScoreDirection
): number | null {
    if (scores.length === 0) return null;

    if (direction === "HIGHER_BETTER") {
        return Math.max(...scores);
    } else {
        return Math.min(...scores);
    }
}
