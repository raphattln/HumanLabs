import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrainCharacter } from "@/components/brain-character";
import {
  Zap,
  Target,
  Boxes,
  Brain,
  Binary,
  Languages,
  Shapes,
  Keyboard,
  PlayCircle,
  Palette,
  Clock
} from "lucide-react";

const allGames = [
  {
    title: "Reaction Time",
    description: "How fast are your reflexes?",
    slug: "reaction-time",
    icon: Zap,
    color: "bg-blue-100 text-blue-600",
    isNew: false,
  },
  {
    title: "Aim Trainer",
    description: "Test your precision.",
    slug: "aim-trainer",
    icon: Target,
    color: "bg-red-100 text-red-600",
    isNew: false,
  },
  {
    title: "Sequence Memory",
    description: "Remember the pattern.",
    slug: "sequence-memory",
    icon: Boxes,
    color: "bg-amber-100 text-amber-600",
    isNew: false,
  },
  {
    title: "Visual Memory",
    description: "Find the squares.",
    slug: "visual-memory",
    icon: Brain,
    color: "bg-purple-100 text-purple-600",
    isNew: false,
  },
  {
    title: "Number Memory",
    description: "Memorize the digits.",
    slug: "number-memory",
    icon: Binary,
    color: "bg-emerald-100 text-emerald-600",
    isNew: false,
  },
  {
    title: "Verbal Memory",
    description: "SEEN or NEW?",
    slug: "verbal-memory",
    icon: Languages,
    color: "bg-indigo-100 text-indigo-600",
    isNew: false,
  },
  {
    title: "Chimp Test",
    description: "Working memory challenge.",
    slug: "chimp-test",
    icon: Shapes,
    color: "bg-orange-100 text-orange-600",
    isNew: false,
  },
  {
    title: "Typing Test",
    description: "Speed and accuracy.",
    slug: "typing-test",
    icon: Keyboard,
    color: "bg-cyan-100 text-cyan-600",
    isNew: false,
  },
  {
    title: "Go / No-Go",
    description: "Test impulse control.",
    slug: "go-no-go",
    icon: PlayCircle,
    color: "bg-green-100 text-green-600",
    isNew: true,
  },
  {
    title: "Stroop Test",
    description: "Name the ink color.",
    slug: "stroop-test",
    icon: Palette,
    color: "bg-pink-100 text-pink-600",
    isNew: true,
  },
  {
    title: "Time Estimation",
    description: "Feel the seconds.",
    slug: "time-estimation",
    icon: Clock,
    color: "bg-teal-100 text-teal-600",
    isNew: true,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <p className="text-sm text-muted-foreground mt-4">salut clemence</p>
      {/* Hero Section */}
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8">
            <div className="space-y-8">
              <h1 className="font-heading font-bold text-foreground">
                <div className="text-6xl sm:text-7xl lg:text-8xl leading-[1.1]">
                  Is your brain
                </div>
                <div className="text-5xl sm:text-6xl lg:text-7xl leading-[1.1] mt-2">
                  cooked or <span className="text-accent">cracked</span>?
                </div>
              </h1>
              <p className="text-xl sm:text-2xl text-foreground leading-[1.6] max-w-[560px]">
                Play 11 fun mini-games to test your reaction time, memory, and cognitive skills.
                Track your progress over time and see how you compare with others.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/games">
                <Button size="lg" className="text-lg px-8">
                  Test my brain
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  How it works
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Brain Character - Closer to edge */}
          <div className="flex justify-center lg:justify-end lg:-mr-4 xl:-mr-8">
            <div className="scale-110 lg:scale-125">
              <BrainCharacter />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games Grid */}
      <section className="w-full max-w-7xl px-4 py-24">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-2">All 11 Games</h2>
            <p className="text-muted-foreground">Choose your challenge and start testing!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allGames.map((game) => (
            <Link key={game.slug} href={`/games/${game.slug}`}>
              <Card className="h-full group cursor-pointer relative">
                {game.isNew && (
                  <div className="absolute -top-3 -right-3 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                    NEW
                  </div>
                )}
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`p-5 rounded-2xl ${game.color} group-hover:scale-110 transition-transform duration-200`}>
                    <game.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {game.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Teaser */}
      <section className="w-full bg-gradient-to-b from-background to-muted/20 py-24 px-4 flex justify-center">
        <div className="max-w-4xl w-full text-center">
          <div className="inline-block mb-6">
            <div className="text-6xl animate-float">🏆</div>
          </div>
          <h2 className="text-4xl font-heading font-bold mb-6">Track Your Growth</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Create a free account to save your scores, climb the leaderboards,
            and watch yourself improve over time.
          </p>
          <Link href="/signup">
            <Button variant="secondary" size="lg" className="shadow-lg">Create Free Account</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
