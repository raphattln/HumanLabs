import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Check,
    Sparkles,
    BarChart3,
    Clock,
    TrendingUp,
    Download,
    Shield,
    Brain,
    Heart,
    Zap
} from "lucide-react";

export default function PricingPage() {
    return (
        <div className="flex flex-col items-center">
            {/* Hero */}
            <section className="w-full py-20 px-4 bg-gradient-to-b from-background to-muted/20">
                <div className="container mx-auto max-w-3xl text-center">
                    <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">
                        Simple pricing.<br />No pressure.
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        All games are free, forever. Upgrade to Pro if you want deeper insights and tracking.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="w-full max-w-5xl px-4 py-16 -mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Free Tier */}
                    <Card className="relative">
                        <div className="flex flex-col h-full">
                            <div className="mb-6">
                                <h3 className="text-2xl font-heading font-bold mb-2">Free</h3>
                                <p className="text-muted-foreground">Perfect for casual play</p>
                            </div>

                            <div className="mb-8">
                                <div className="text-5xl font-heading font-bold mb-2">$0</div>
                                <p className="text-sm text-muted-foreground">Forever</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow">
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Play all 11 games unlimited</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Instant scores after each game</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>View global leaderboards</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Keep last 5 results per game</span>
                                </li>
                            </ul>

                            <Link href="/games" className="mt-auto">
                                <Button variant="outline" size="lg" className="w-full">
                                    Start Playing Free
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Pro Tier */}
                    <Card className="relative border-2 border-accent">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Most Popular
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="mb-6">
                                <h3 className="text-2xl font-heading font-bold mb-2">Pro</h3>
                                <p className="text-muted-foreground">For tracking progress</p>
                            </div>

                            <div className="mb-8">
                                <div className="text-5xl font-heading font-bold mb-2">$5</div>
                                <p className="text-sm text-muted-foreground">Per month</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow">
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">Everything in Free, plus:</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                                    <span>Unlimited result history</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <BarChart3 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                                    <span>Progress charts & trends</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <TrendingUp className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                                    <span>Percentile rankings</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Download className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                                    <span>Export your data anytime</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                                    <span>Early access to new features</span>
                                </li>
                            </ul>

                            <Button size="lg" className="w-full mt-auto">
                                Upgrade to Pro
                            </Button>
                        </div>
                    </Card>
                </div>
            </section>

            {/* What Pro Adds */}
            <section className="w-full bg-muted/30 py-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-3xl font-heading font-bold mb-12 text-center">
                        What Pro Actually Adds
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="text-center">
                            <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl inline-block mb-6">
                                <Clock className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Memory</h3>
                            <p className="text-muted-foreground">
                                See all your past scores, not just the last few. Track yourself over weeks and months.
                            </p>
                        </Card>

                        <Card className="text-center">
                            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl inline-block mb-6">
                                <BarChart3 className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Perspective</h3>
                            <p className="text-muted-foreground">
                                Know exactly where you stand. Get percentile rankings to see how you compare.
                            </p>
                        </Card>

                        <Card className="text-center">
                            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl inline-block mb-6">
                                <TrendingUp className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Progress</h3>
                            <p className="text-muted-foreground">
                                Visualize your improvement with charts. See trends, spot patterns, celebrate wins.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="w-full max-w-4xl px-4 py-20">
                <h2 className="text-3xl font-heading font-bold mb-12 text-center">
                    What We'll Never Do
                </h2>
                <div className="space-y-6">
                    <Card className="flex items-start gap-6">
                        <div className="p-4 bg-red-100 text-red-600 rounded-2xl flex-shrink-0">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">❌ No Ads, Ever</h3>
                            <p className="text-muted-foreground">
                                We don't show ads. Your experience stays clean, focused, and distraction-free.
                            </p>
                        </div>
                    </Card>

                    <Card className="flex items-start gap-6">
                        <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl flex-shrink-0">
                            <Brain className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">❌ No Paywalled Games</h3>
                            <p className="text-muted-foreground">
                                Every single game is free to play. Pro is only about tracking and insights, not access.
                            </p>
                        </div>
                    </Card>

                    <Card className="flex items-start gap-6">
                        <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl flex-shrink-0">
                            <Heart className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">❌ No Data Selling</h3>
                            <p className="text-muted-foreground">
                                Your results are yours. We never sell your data to third parties. Privacy first.
                            </p>
                        </div>
                    </Card>
                </div>
            </section>

            {/* FAQ */}
            <section className="w-full bg-muted/30 py-20 px-4">
                <div className="container mx-auto max-w-3xl">
                    <h2 className="text-3xl font-heading font-bold mb-12 text-center">
                        Questions?
                    </h2>
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold mb-3">Can I try before subscribing?</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Absolutely. Play all the games for free, see if you like the platform.
                                Only upgrade if you want the extra tracking features.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-3">Can I cancel anytime?</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Yes. Cancel with one click from your account page. No questions asked,
                                no hidden fees.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-3">What happens to my data if I cancel?</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Your data stays saved. If you resubscribe later, everything will be right where you left it.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-3">Do you offer refunds?</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                If you're unhappy in the first 30 days, email us and we'll refund you. No hassle.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Soft CTA */}
            <section className="w-full py-24 px-4">
                <div className="container mx-auto max-w-2xl text-center">
                    <h2 className="text-4xl font-heading font-bold mb-6">
                        Not Ready to Decide?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                        No problem. Play some games first. See if you like it. Pricing will be here when you're ready.
                    </p>
                    <Link href="/games/reaction-time">
                        <Button size="lg" variant="outline">
                            Try a Game Instead
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
