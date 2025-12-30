import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
    Zap,
    Target,
    Boxes,
    Brain,
    Binary,
    Languages,
    Shapes,
    Keyboard
} from "lucide-react";

const allGames = [
    {
        title: "Reaction Time",
        description: "Test your visual reflexes.",
        slug: "reaction-time",
        icon: Zap,
        color: "bg-blue-500/10 text-blue-500",
    },
    {
        title: "Aim Trainer",
        description: "Hit the targets as fast as you can.",
        slug: "aim-trainer",
        icon: Target,
        color: "bg-red-500/10 text-red-500",
    },
    {
        title: "Sequence Memory",
        description: "Remember an ever-growing pattern of squares.",
        slug: "sequence-memory",
        icon: Boxes,
        color: "bg-amber-500/10 text-amber-500",
    },
    {
        title: "Visual Memory",
        description: "Remember an increasing number of squares on a grid.",
        slug: "visual-memory",
        icon: Brain,
        color: "bg-purple-500/10 text-purple-500",
    },
    {
        title: "Number Memory",
        description: "Remember the longest number you can.",
        slug: "number-memory",
        icon: Binary,
        color: "bg-emerald-500/10 text-emerald-500",
    },
    {
        title: "Verbal Memory",
        description: "Keep as many words as possible in short-term memory.",
        slug: "verbal-memory",
        icon: Languages,
        color: "bg-indigo-500/10 text-indigo-500",
    },
    {
        title: "Chimp Test",
        description: "Are you smarter than a chimpanzee?",
        slug: "chimp-test",
        icon: Shapes,
        color: "bg-orange-500/10 text-orange-500",
    },
    {
        title: "Typing Test",
        description: "How many words per minute can you type?",
        slug: "typing-test",
        icon: Keyboard,
        color: "bg-pink-500/10 text-pink-500",
    },
];

export default function GamesPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="mb-12">
                <h1 className="text-4xl font-heading font-bold mb-4">All Benchmarks</h1>
                <p className="text-lg text-muted-foreground">
                    Challenge your brain with our specialized cognitive tests.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allGames.map((game) => (
                    <Link key={game.slug} href={`/games/${game.slug}`}>
                        <Card className="h-full hover:border-accent transition-all group p-6 flex flex-col items-center text-center">
                            <div className={`p-4 rounded-xl mb-6 ${game.color} group-hover:scale-110 transition-transform`}>
                                <game.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                            <p className="text-muted-foreground text-sm">
                                {game.description}
                            </p>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
