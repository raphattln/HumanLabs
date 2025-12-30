"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Theme = "light" | "dark" | "cream";

type ThemeContextType = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [theme, setThemeState] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage or session
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") as Theme;
        if (storedTheme) {
            setThemeState(storedTheme);
            updateRootClass(storedTheme);
        } else if (session?.user?.theme) {
            // If no local storage but session exists, use session
            setThemeState(session.user.theme as Theme);
            updateRootClass(session.user.theme as Theme);
        }
        setMounted(true);
    }, []);

    // Sync with session changes
    useEffect(() => {
        if (session?.user?.theme) {
            const sessionTheme = session.user.theme as Theme;
            if (sessionTheme !== theme) {
                setThemeState(sessionTheme);
                updateRootClass(sessionTheme);
            }
        }
    }, [session?.user?.theme]);

    const updateRootClass = (newTheme: Theme) => {
        const root = document.documentElement;
        root.classList.remove("theme-light", "theme-dark", "theme-cream");
        root.classList.add(`theme-${newTheme}`);
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        updateRootClass(newTheme);
        localStorage.setItem("theme", newTheme);

        // Persist to DB if authenticated
        if (session) {
            try {
                await fetch("/api/user/theme", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ theme: newTheme }),
                });
            } catch (error) {
                console.error("Failed to persist theme", error);
            }
        }
    };

    // Prevent flash of unstyled content (FOUC) mechanism is partial here 
    // essentially relying on initial CSS vars being light.
    // For a perfect no-flash, we'd need script injection in layout.

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <div style={{ visibility: mounted ? "visible" : "hidden" }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

// Wrapper that doesn't hide content, but maybe we accept a tiny flash or default to light
export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProviderNoFlash>
            {children}
        </ThemeProviderNoFlash>
    )
}

function ThemeProviderNoFlash({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [theme, setThemeState] = useState<Theme>("light");

    useEffect(() => {
        // Recovery priority: LocalStorage > Session > Default
        const stored = localStorage.getItem("theme") as Theme;
        if (stored) {
            setThemeState(stored);
            document.documentElement.classList.add(`theme-${stored}`);
        } else if (session?.user?.theme) {
            setThemeState(session.user.theme as Theme);
            document.documentElement.classList.add(`theme-${session.user.theme}`);
        } else {
            document.documentElement.classList.add("theme-light");
        }
    }, [session]);

    const setTheme = async (newTheme: Theme) => {
        const root = document.documentElement;
        root.classList.remove("theme-light", "theme-dark", "theme-cream");
        root.classList.add(`theme-${newTheme}`);
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);

        if (session) {
            try {
                await fetch("/api/user/theme", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ theme: newTheme }),
                });
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}


export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
