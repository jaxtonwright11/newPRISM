"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PrismWordmark } from "@/components/prism-wordmark";
import { ShimmerButton } from "@/components/shimmer-button";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

// Progressive lockout: 0→0s, 1→0s, 2→0s, 3→5s, 4→15s, 5→30s, 6+→60s
const LOCKOUT_TIERS = [0, 0, 0, 5, 15, 30, 60];
function getLockoutSeconds(attempts: number): number {
  return LOCKOUT_TIERS[Math.min(attempts, LOCKOUT_TIERS.length - 1)];
}

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/";
  // Prevent open redirect — only allow relative paths
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";
  const callbackError = searchParams.get("error");
  const { signIn, signInWithGoogle } = useAuth();

  // Countdown timer for lockout display
  useEffect(() => {
    if (lockedUntil <= Date.now()) {
      setCooldownRemaining(0);
      return;
    }
    setCooldownRemaining(Math.ceil((lockedUntil - Date.now()) / 1000));
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldownRemaining(0);
        clearInterval(interval);
      } else {
        setCooldownRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if still locked out
    if (Date.now() < lockedUntil) {
      setError(`Too many attempts. Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)}s.`);
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      const lockoutSec = getLockoutSeconds(newAttempts);
      if (lockoutSec > 0) {
        const until = Date.now() + lockoutSec * 1000;
        setLockedUntil(until);
        setError(`Invalid credentials. Account locked for ${lockoutSec}s.`);
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      setFailedAttempts(0);
      setLockedUntil(0);
      router.push(redirectTo);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-prism-bg-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows — community colors */}
      <div className="absolute top-1/4 -left-24 w-80 h-80 rounded-full bg-prism-accent-primary/[0.08] blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-1/4 -right-24 w-72 h-72 rounded-full bg-prism-community-diaspora/[0.08] blur-3xl animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
      <div className="absolute top-2/3 left-1/4 w-48 h-48 rounded-full bg-prism-community-civic/[0.05] blur-3xl" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <PrismWordmark size="lg" />
          <h1 className="font-display text-2xl font-bold text-prism-text-primary mt-6 tracking-tight">
            Sign in to PRISM
          </h1>
          <p className="text-sm text-prism-text-secondary mt-1 font-body">
            See the world through every community&apos;s eyes
          </p>
        </div>

        {/* Error messages */}
        {callbackError && !error && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {callbackError === "auth_callback_failed"
              ? "Sign-in failed. Please try again."
              : "Something went wrong. Please try again."}
          </div>
        )}
        {error && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-prism-text-secondary mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-prism-bg-surface border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary focus:bg-prism-bg-elevated/50 focus:shadow-[0_0_0_3px_rgba(212,149,107,0.1)] transition-all"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-prism-text-secondary mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-prism-bg-surface border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary focus:bg-prism-bg-elevated/50 focus:shadow-[0_0_0_3px_rgba(212,149,107,0.1)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-prism-text-dim hover:text-prism-text-secondary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <ShimmerButton
            type="submit"
            loading={loading}
            disabled={cooldownRemaining > 0}
            fullWidth
          >
            {cooldownRemaining > 0
              ? `Locked (${cooldownRemaining}s)`
              : loading
                ? "Signing in..."
                : "Sign in"}
          </ShimmerButton>
        </form>

        <div className="text-right mt-2">
          <Link
            href="/forgot-password"
            className="text-xs text-prism-text-dim hover:text-prism-accent-primary transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-prism-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-prism-bg-base px-3 text-prism-text-dim">
              or continue with
            </span>
          </div>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 rounded-xl bg-prism-bg-surface border border-prism-border text-sm text-prism-text-primary hover:bg-prism-bg-elevated hover:border-prism-text-dim/30 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        {/* Sign up link */}
        <p className="text-center text-sm text-prism-text-dim mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-prism-accent-primary hover:underline"
          >
            Sign up
          </Link>
        </p>

        {/* Back to home */}
        <p className="text-center mt-4">
          <Link
            href="/"
            className="text-xs text-prism-text-dim hover:text-prism-text-secondary transition-colors"
          >
            &larr; Back to exploring
          </Link>
        </p>
      </div>
    </div>
  );
}
