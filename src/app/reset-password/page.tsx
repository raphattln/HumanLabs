"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getPasswordStrength } from "@/lib/auth-utils";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const passwordStrength = getPasswordStrength(newPassword);

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("Invalid or missing reset token");
            return;
        }

        if (!newPassword || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!passwordStrength.checks.minLength || !passwordStrength.checks.hasLetter || !passwordStrength.checks.hasNumber) {
            setError("Password does not meet requirements");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Reset failed");
            }

            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push("/login?reset=success");
            }, 2000);
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
                    <div className="text-6xl mb-6">✅</div>
                    <h1 className="text-3xl font-heading font-bold mb-4">Password updated!</h1>
                    <p className="text-muted-foreground mb-8">
                        Your password has been successfully reset. Redirecting to login...
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-24 max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-heading font-bold mb-2">Reset Password</h1>
                <p className="text-muted-foreground">
                    Choose a new password for your account
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                            New Password
                        </label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min 10 characters"
                            required
                            disabled={loading || !token}
                        />

                        {newPassword && (
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="flex-grow h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${passwordStrength.score === 0 ? "w-1/4 bg-red-500" :
                                                passwordStrength.score === 1 ? "w-2/4 bg-orange-500" :
                                                    passwordStrength.score === 2 ? "w-3/4 bg-yellow-500" :
                                                        passwordStrength.score === 3 ? "w-full bg-green-500" :
                                                            "w-full bg-emerald-600"
                                                }`}
                                        />
                                    </div>
                                    <span className="text-xs font-medium w-16">{passwordStrength.feedback}</span>
                                </div>

                                <div className="space-y-1 text-xs">
                                    <div className={passwordStrength.checks.minLength ? "text-green-600" : "text-muted-foreground"}>
                                        {passwordStrength.checks.minLength ? "✓" : "○"} At least 10 characters
                                    </div>
                                    <div className={passwordStrength.checks.hasLetter ? "text-green-600" : "text-muted-foreground"}>
                                        {passwordStrength.checks.hasLetter ? "✓" : "○"} Contains a letter
                                    </div>
                                    <div className={passwordStrength.checks.hasNumber ? "text-green-600" : "text-muted-foreground"}>
                                        {passwordStrength.checks.hasNumber ? "✓" : "○"} Contains a number
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                            Confirm Password
                        </label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            required
                            disabled={loading || !token}
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <Button type="submit" size="lg" className="w-full" disabled={loading || !token}>
                        {loading ? "Updating..." : "Update Password"}
                    </Button>

                    <div className="text-center">
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-accent">
                            ← Back to Login
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-24 text-center">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
