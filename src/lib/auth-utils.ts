import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Hash a password using bcrypt with cost factor 12
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random token (32 bytes = 64 hex chars)
 */
export function generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token for secure storage in database
 */
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Validate password strength
 * Requirements: min 10 chars, at least 1 letter and 1 digit
 */
export function validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 10) {
        errors.push("Password must be at least 10 characters long");
    }

    if (!/[a-zA-Z]/.test(password)) {
        errors.push("Password must contain at least one letter");
    }

    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Check password strength for UI feedback
 */
export function getPasswordStrength(password: string): {
    score: number; // 0-4
    feedback: string;
    checks: {
        minLength: boolean;
        hasLetter: boolean;
        hasNumber: boolean;
        hasSpecialChar: boolean;
    };
} {
    const checks = {
        minLength: password.length >= 10,
        hasLetter: /[a-zA-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    let score = 0;
    if (checks.minLength) score++;
    if (checks.hasLetter) score++;
    if (checks.hasNumber) score++;
    if (checks.hasSpecialChar) score++;

    const feedbackMap: Record<number, string> = {
        0: "Very weak",
        1: "Weak",
        2: "Fair",
        3: "Good",
        4: "Strong",
    };

    return {
        score,
        feedback: feedbackMap[score] || "Very weak",
        checks,
    };
}
