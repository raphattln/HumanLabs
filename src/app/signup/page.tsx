"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getPasswordStrength } from "@/lib/auth-utils";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        console.log("=== SIGNUP SUBMIT DEBUG ===");
        console.log("Email:", email);
        console.log("Password length:", password.length);
        console.log("ConfirmPassword length:", confirmPassword.length);
        console.log("Passwords match:", password === confirmPassword);

        // Client-side validation
        if (!email || !password || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        const cleanEmail = email.trim().toLowerCase();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!passwordStrength.checks.minLength || !passwordStrength.checks.hasLetter || !passwordStrength.checks.hasNumber) {
            setError("Password must be at least 10 characters with 1 letter and 1 number");
            return;
        }

        setLoading(true);

        try {
            const payload = { email: cleanEmail, password, confirmPassword };
            console.log("Sending to /api/auth/signup:", { email: cleanEmail, passwordLength: password.length });

            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            console.log("\n=== RESPONSE DEBUG ===");
            console.log("Status:", res.status);
            console.log("Status Text:", res.statusText);
            console.log("URL:", res.url);
            console.log("Redirected:", res.redirected);
            console.log("Content-Type:", res.headers.get("content-type"));
            console.log("Headers:", Object.fromEntries(res.headers.entries()));

            const contentType = res.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                // NOT JSON - likely HTML error page or redirect
                const text = await res.text();
                const preview = text.substring(0, 300);

                console.error("\n=== NON-JSON RESPONSE ===");
                console.error("Status:", res.status);
                console.error("URL:", res.url);
                console.error("Redirected:", res.redirected);
                console.error("Content-Type:", contentType);
                console.error("Body preview:", preview);

                // Build detailed error message
                let errorMsg = "API route misconfigured or redirected.\n\n";
                errorMsg += `Status: ${res.status} ${res.statusText}\n`;
                errorMsg += `URL: ${res.url}\n`;
                errorMsg += `Redirected: ${res.redirected}\n`;
                errorMsg += `Content-Type: ${contentType}\n\n`;

                if (res.redirected) {
                    errorMsg += "The request was redirected. Check middleware configuration.";
                } else if (res.status === 404) {
                    errorMsg += "API route not found. Verify /api/auth/signup/route.ts exists.";
                } else if (res.status >= 500) {
                    errorMsg += "Server error. Check server logs for stack trace.";
                } else {
                    errorMsg += "Unknown routing issue.";
                }

                setError(errorMsg);
                return;
            }

            // Parse JSON response
            let data;
            try {
                data = await res.json();
                console.log("Response data:", data);
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                setError("Invalid JSON response from server");
                return;
            }

            if (!res.ok) {
                // API returned error
                console.log("API error:", data);
                throw new Error(data.error || data.message || "Signup failed");
            }

            console.log("Signup successful!");
            console.log("Signup successful!");
            // setSuccess(true); // Removed email check step
            await handleAutoLogin();
        } catch (err: any) {
            console.error("Signup error:", err);
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Auto-login after signup
    const handleAutoLogin = async () => {
        try {
            console.log("Attempting auto-login...");
            const loginRes = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (loginRes.ok) {
                console.log("Auto-login successful");
                router.push("/account"); // or /dashboard
                router.refresh();
            } else {
                console.warn("Auto-login failed, redirecting to login page");
                router.push("/login?created=1");
            }
        } catch (e) {
            console.error("Auto-login error:", e);
            router.push("/login?created=1");
        }
    };


    return (
        <div className="container mx-auto px-4 py-24 max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-heading font-bold mb-2">Create Account</h1>
                <p className="text-muted-foreground">
                    Start tracking your cognitive performance
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 10 characters"
                            disabled={loading}
                            autoComplete="new-password"
                        />

                        {password && (
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
                            disabled={loading}
                            autoComplete="new-password"
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-xs text-red-600 mt-1">❌ Passwords do not match</p>
                        )}
                        {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                            <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                            <pre className="whitespace-pre-wrap text-xs font-mono">{error}</pre>
                        </div>
                    )}

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-accent font-medium hover:underline">
                            Log in
                        </Link>
                    </p>
                </form>
            </Card>
        </div>
    );
}
