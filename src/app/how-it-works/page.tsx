import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrainCharacter } from "@/components/brain-character";
import {
    Play,
    BarChart3,
    Trophy,
    Sparkles,
    Target,
    Clock,
    Shield,
    Heart
} from "lucide-react";

export default function HowItWorksPage() {
    return (
        <div className="flex flex-col items-center">
            {/* Hero */}
            <section className="w-full py-20 px-4 bg-gradient-to-b from-background to-muted/20">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="inline-block mb-8">
                        <BrainCharacter size={200} />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">
                        How It Works
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        HumanLabs is a collection of quick, fun games that test different brain skills.
                        No signup required to play—just pick a game and go!
                    </p>
                </div>
            </section>

            {/* Step by Step */}
            <section className="w-full max-w-6xl px-4 py-20">
                <h2 className="text-3xl font-heading font-bold text-center mb-16">
                    Three Simple Steps
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="text-center group">
                        <div className="inline-block p-6 bg-blue-100 text-blue-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
                            <Play className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">1. Pick a Test</h3>
                        <p className="text-muted-foreground">
                            Choose from 11 games: reaction time, memory, typing, and more.
                        </p>
                    </Card>

                    <Card className="text-center group">
                        <div className="inline-block p-6 bg-emerald-100 text-emerald-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
                            <Target className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">2. Play</h3>
                        <p className="text-muted-foreground">
                            Each game takes 30 seconds to 2 minutes. Short, focused, fun.
                        </p>
                    </Card>

                    <Card className="text-center group">
                        <div className="inline-block p-6 bg-purple-100 text-purple-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
                            <BarChart3 className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">3. Get Results</h3>
                        <p className="text-muted-foreground">
                            See your score instantly. Create an account to save and track progress.
                        </p>
                    </Card>
                </div>
            </section>

            {/* How Games Work */}
            <section className="w-full bg-muted/30 py-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-3xl font-heading font-bold mb-12 text-center">
                        What Makes a Good Test?
                    </h2>
                    <div className="space-y-6">
                        <Card className="flex items-start gap-6">
                            <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl flex-shrink-0">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">One Skill at a Time</h3>
                                <p className="text-muted-foreground">
                                    Each game tests a single thing: how fast you click, how many numbers you remember,
                                    how well you type. No confusion, no tricks.
                                </p>
                            </div>
                        </Card>

                        <Card className="flex items-start gap-6">
                            <div className="p-4 bg-green-100 text-green-600 rounded-2xl flex-shrink-0">
                                <Shield className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Fair Rules</h3>
                                <p className="text-muted-foreground">
                                    Everyone gets the same game. Same visuals, same timing, same scoring.
                                    Your result is comparable to anyone else's.
                                </p>
                            </div>
                        </Card>

                        <Card className="flex items-start gap-6">
                            <div className="p-4 bg-cyan-100 text-cyan-600 rounded-2xl flex-shrink-0">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Quick Sessions</h3>
                                <p className="text-muted-foreground">
                                    No marathons. Each test is designed to give you a solid result in under 2 minutes.
                                    Play one, play them all—it's up to you.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Why It's Useful */}
            <section className="w-full max-w-4xl px-4 py-20">
                <h2 className="text-3xl font-heading font-bold mb-12 text-center">
                    Why Play These Games?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">It's Fun</h3>
                        </div>
                        <p className="text-muted-foreground">
                            Challenging yourself feels good. Beating your old score feels even better.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">Track Progress</h3>
                        </div>
                        <p className="text-muted-foreground">
                            See your improvement over time. Some skills you can train, some just vary by day.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">Compare Globally</h3>
                        </div>
                        <p className="text-muted-foreground">
                            How do you stack up? Check the leaderboards to see where you stand.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">Satisfy Curiosity</h3>
                        </div>
                        <p className="text-muted-foreground">
                            Ever wonder how fast your reflexes are? How many digits you can remember? Now you know.
                        </p>
                    </div>
                </div>
            </section>

            {/* What It's NOT */}
            <section className="w-full bg-muted/30 py-20 px-4">
                <div className="container mx-auto max-w-3xl">
                    <h2 className="text-3xl font-heading font-bold mb-8 text-center">
                        What This Isn't
                    </h2>
                    <Card>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold mb-2">❌ Not a Medical Tool</h3>
                                <p className="text-muted-foreground">
                                    This is for fun and curiosity. It's not a diagnostic tool and shouldn't be used
                                    to make any health decisions.
                                </p>
                            </div>
                            <div className="border-t border-border pt-6">
                                <h3 className="text-xl font-bold mb-2">❌ Not an IQ Test</h3>
                                <p className="text-muted-foreground">
                                    We measure specific skills like reaction time and memory span.
                                    IQ tests are much broader and more complex.
                                </p>
                            </div>
                            <div className="border-t border-border pt-6">
                                <h3 className="text-xl font-bold mb-2">✅ Just Games</h3>
                                <p className="text-muted-foreground">
                                    Think of this like a friendly competition with yourself and others.
                                    Play, improve, have fun.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Meet Your Guide */}
            <section className="w-full max-w-4xl px-4 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-heading font-bold mb-6">
                            Meet Your Brain Buddy
                        </h2>
                        <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                            This friendly brain character is here to guide you through the platform.
                            Think of it as your cheerful coach, celebrating your wins and encouraging you to try again.
                        </p>
                        <p className="text-muted-foreground">
                            No judgment, no pressure—just playful encouragement to explore what your brain can do.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <BrainCharacter size={300} />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="w-full bg-gradient-to-b from-muted/20 to-background py-24 px-4">
                <div className="container mx-auto max-w-2xl text-center">
                    <h2 className="text-4xl font-heading font-bold mb-6">
                        Ready to Play?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10">
                        Pick any game and see what you're capable of. No signup needed.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/games/reaction-time">
                            <Button size="lg" className="w-full sm:w-auto">
                                Try Reaction Time
                            </Button>
                        </Link>
                        <Link href="/games">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                Browse All Games
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
