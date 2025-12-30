"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Chrome } from "lucide-react";

interface AuthFormProps {
    mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (mode === "login") {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/account");
                router.refresh();
            }
        } else {
            // Signup logic
            try {
                const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    body: JSON.stringify({ email, password }),
                    headers: { "Content-Type": "application/json" },
                });

                if (res.ok) {
                    await signIn("credentials", { email, password, callbackUrl: "/account" });
                } else {
                    const data = await res.json();
                    setError(data.message || "Something went wrong");
                }
            } catch (err) {
                setError("Failed to create account");
            }
        }
        setLoading(false);
    };

    return (
        <Card className="w-full max-w-md">
            <h2 className="text-2xl font-heading font-bold mb-6 text-center">
                {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm bg-red-50 text-red-500 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground" htmlFor="email">
                        Email address
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus-ring"
                        placeholder="you@example.com"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus-ring"
                        placeholder="••••••••"
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
                </Button>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={() => signIn("google", { callbackUrl: "/account" })}
                >
                    <Chrome className="w-4 h-4" />
                    Google
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                    <>
                        Don&apos;t have an account?{" "}
                        <a href="/signup" className="text-accent hover:underline font-medium">Sign up</a>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <a href="/login" className="text-accent hover:underline font-medium">Log in</a>
                    </>
                )}
            </p>
        </Card>
    );
}
