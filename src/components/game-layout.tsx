"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, BarChart3, RotateCcw, Share2 } from "lucide-react";

interface GameLayoutProps {
    title: string;
    description: string;
    instructions: string;
    icon: React.ElementType;
    children: React.ReactNode;
    onReset?: () => void;
    gameStatus: "idle" | "playing" | "result";
}

export function GameLayout({
    title,
    description,
    instructions,
    icon: Icon,
    children,
    onReset,
    gameStatus,
}: GameLayoutProps) {
    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-accent/10 text-accent">
                            <Icon className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-heading font-bold">{title}</h1>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {description}
                    </p>

                    <Card padding="sm" className="bg-muted/30 border-none">
                        <div className="flex items-center gap-2 mb-3 font-semibold text-sm">
                            <Info className="w-4 h-4 text-accent" />
                            How to play
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {instructions}
                        </p>
                    </Card>

                    {gameStatus === "result" && (
                        <div className="space-y-3 pt-4 border-t border-border">
                            <Button onClick={onReset} className="w-full gap-2">
                                <RotateCcw className="w-4 h-4" />
                                Play Again
                            </Button>
                            <Button variant="outline" className="w-full gap-2">
                                <Share2 className="w-4 h-4" />
                                Share Result
                            </Button>
                        </div>
                    )}

                    <Link href="/stats" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
                        <BarChart3 className="w-4 h-4" />
                        View global stats
                    </Link>
                </div>

                {/* Main Game Area */}
                <div className="lg:col-span-3">
                    <Card padding="none" className="min-h-[500px] overflow-hidden flex flex-col relative">
                        {children}
                    </Card>
                </div>
            </div>
        </div>
    );
}

import Link from "next/link";
