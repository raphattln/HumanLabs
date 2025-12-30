"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface BrainCharacterProps {
    className?: string;
    size?: number;
}

export function BrainCharacter({ className = "", size = 500 }: BrainCharacterProps) {
    const [blink, setBlink] = useState(false);

    useEffect(() => {
        // Random blink interval (every 3-7 seconds)
        const blinkInterval = setInterval(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 200);
        }, Math.random() * 4000 + 3000);

        return () => clearInterval(blinkInterval);
    }, []);

    return (
        <div className={`relative ${className} bg-transparent`}>
            <div className="animate-breathe">
                <Image
                    src="/brain-character-v2.png"
                    alt="Brain character mascot"
                    width={size}
                    height={size}
                    className="w-full h-auto"
                    priority
                />
            </div>
            {/* Blink overlay: visual effect only, ensure strictly no background */}
            {blink && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Blink effect logic if needed, otherwise empty to ensure transparency */}
                </div>
            )}
        </div>
    );
}
