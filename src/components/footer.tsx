import Link from "next/link";
import { Twitter, Instagram } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full border-t border-border bg-muted/30 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link
                            href="/"
                            className="text-xl font-heading font-bold text-foreground"
                        >
                            Human<span className="text-accent">Labs</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Original benchmarks for the modern mind.
                        </p>
                        <div className="flex gap-4">
                            <Link href="https://twitter.com/cosmoprono" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                                <Twitter className="h-5 w-5" />
                                <span className="sr-only">Twitter</span>
                            </Link>
                            <Link href="https://instagram.com/humanlabs.official" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                                <Instagram className="h-5 w-5" />
                                <span className="sr-only">Instagram</span>
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">Games</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/games/reaction-time" className="hover:text-accent transition-colors">Reaction Time</Link></li>
                            <li><Link href="/games/aim-trainer" className="hover:text-accent transition-colors">Aim Trainer</Link></li>
                            <li><Link href="/games/sequence-memory" className="hover:text-accent transition-colors">Sequence Memory</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/how-it-works" className="hover:text-accent transition-colors">How it works</Link></li>
                            <li><Link href="/pricing" className="hover:text-accent transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">Support</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} HumanLabs. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
