"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setError("Invalid or missing verification token");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Verification failed");
                }

                setVerified(true);
            } catch (err: any) {
                setError(err.message || "Verification failed");
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [token]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-24 max-w-md">
                <Card className="text-center">
                    <div className="text-6xl mb-6 animate-pulse">⏳</div>
                    <h1 className="text-3xl font-heading font-bold mb-4">Verifying...</h1>
                    <p className="text-muted-foreground">
                        Please wait while we verify your email address.
                    </p>
                </Card>
            </div>
        );
    }

    if (verified) {
        return (
            <div className="container mx-auto px-4 py-24 max-w-md">
                <Card className="text-center">
                    <div className="text-6xl mb-6">✅</div>
                    <h1 className="text-3xl font-heading font-bold mb-4">Email Verified!</h1>
                    <p className="text-muted-foreground mb-8">
                        Your email has been successfully verified. You can now log in to your account.
                    </p>
                    <Link href="/login">
                        <Button size="lg" className="w-full">
                            Go to Login
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-24 max-w-md">
            <Card className="text-center">
                <div className="text-6xl mb-6">❌</div>
                <h1 className="text-3xl font-heading font-bold mb-4">Verification Failed</h1>
                <p className="text-red-600 mb-6">{error}</p>
                <p className="text-muted-foreground mb-8">
                    The verification link may have expired or already been used.
                </p>
                <div className="space-y-4">
                    <Link href="/login">
                        <Button variant="outline" size="lg" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-24 text-center">Loading...</div>}>
            <VerifyEmailForm />
        </Suspense>
    );
}
