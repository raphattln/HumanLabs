import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: "none" | "sm" | "md" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, padding = "md", ...props }, ref) => {
        const paddings = {
            none: "p-0",
            sm: "p-4",
            md: "p-8",
            lg: "p-12",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "bg-card text-card-foreground rounded-3xl border border-border shadow-soft interact-lift",
                    paddings[padding],
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";

export { Card };
