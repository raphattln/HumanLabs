"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email) {
            setError("Email is required");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Request failed");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="container mx-auto px-4 py-24 max-w-md">
                <Card className="text-center">
                    <div className="text-6xl mb-6">📧</div>
                    <h1 className="text-3xl font-heading font-bold mb-4">Check your email</h1>
                    <p className="text-muted-foreground mb-8">
                        If an account exists with <strong>{email}</strong>, we've sent a password reset link.
                    </p>
                    <p className="text-sm text-muted-foreground mb-8">
                        The link will expire in 15 minutes for security.
                    </p>
                    <Link href="/login">
                        <Button variant="outline" size="lg" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-24 max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-heading font-bold mb-2">Forgot Password?</h1>
                <p className="text-muted-foreground">
                    Enter your email and we'll send you a reset link
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                    </Button>

                    <div className="text-center space-y-2">
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-accent">
                            ← Back to Login
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}
