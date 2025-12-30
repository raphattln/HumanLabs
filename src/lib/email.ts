import { Resend } from "resend";

// Lazy-load Resend to avoid crash on module import
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("⚠️  RESEND_API_KEY not configured. Emails will NOT be sent.");
    console.warn("   Add RESEND_API_KEY to .env to enable email sending.");
    return null;
  }

  try {
    resendClient = new Resend(apiKey);
    console.log("✓ Resend client initialized successfully");
    return resendClient;
  } catch (error) {
    console.error("Failed to initialize Resend client:", error);
    return null;
  }
}

const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3001";

export async function sendVerificationEmail(email: string, token: string) {
  const resend = getResendClient();

  if (!resend) {
    console.warn(`[EMAIL SKIPPED] Verification email for ${email}`);
    console.warn(`  Verification URL would be: ${APP_URL}/verify-email?token=${token}`);
    console.warn(`  Configure RESEND_API_KEY to enable email sending.`);
    return; // Don't throw - allow signup to continue
  }

  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Confirm your email - HumanLabs",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 30px 0;">
              <h1 style="color: #EE6C4D; margin: 0;">🧠 HumanLabs</h1>
            </div>
            
            <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #333;">Confirm your email</h2>
              <p style="font-size: 16px; margin: 20px 0;">
                Hi! Thanks for signing up. Click the button below to verify your email and activate your account:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #EE6C4D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Verify Email
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin: 20px 0;">
                This link expires in 24 hours.
              </p>
              
              <p style="font-size: 14px; color: #666; margin: 20px 0;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
              <p>HumanLabs - Cognitive Performance Benchmarks</p>
            </div>
          </body>
        </html>
      `,
    });
    console.log(`✓ Verification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Don't throw - allow signup to continue even if email fails
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resend = getResendClient();

  if (!resend) {
    console.warn(`[EMAIL SKIPPED] Password reset email for ${email}`);
    console.warn(`  Reset URL would be: ${APP_URL}/reset-password?token=${token}`);
    return;
  }

  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your password - HumanLabs",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 30px 0;">
              <h1 style="color: #EE6C4D; margin: 0;">🧠 HumanLabs</h1>
            </div>
            
            <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #333;">Reset your password</h2>
              <p style="font-size: 16px; margin: 20px 0;">
                Hi! We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #EE6C4D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin: 20px 0;">
                This link expires in 15 minutes for security.
              </p>
              
              <p style="font-size: 14px; color: #666; margin: 20px 0;">
                If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
              <p>HumanLabs - Cognitive Performance Benchmarks</p>
            </div>
          </body>
        </html>
      `,
    });
    console.log(`✓ Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
}
