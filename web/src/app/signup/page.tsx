"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PrismWordmark } from "@/components/prism-wordmark";
import { prismEvents } from "@/lib/posthog";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"create" | "check-email" | "community">("create");
  const router = useRouter();
  const { signUp, signInWithGoogle, supabase } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signUp(email, password, username);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      // Check if a session was created (email confirmation disabled → auto-login)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        prismEvents.authSignupCompleted("direct");
        router.push('/onboarding');
      } else {
        // Email confirmation required — show check-email step
        setStep("check-email");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  if (step === "check-email") {
    return (
      <div className="min-h-screen bg-prism-bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-prism-accent-primary/10 mb-6">
            <svg
              className="w-8 h-8 text-prism-accent-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h1 className="font-body text-xl font-bold text-prism-text-primary mb-2">
            Check your email
          </h1>
          <p className="text-sm text-prism-text-secondary mb-6">
            We sent a confirmation link to <span className="text-prism-text-primary font-medium">{email}</span>.
            Click the link to activate your account, then come back here to sign in.
          </p>

          <Link
            href="/login"
            className="inline-flex px-6 py-2.5 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-primary/90 transition-colors"
          >
            Go to Sign In
          </Link>

          <p className="text-xs text-prism-text-dim mt-4">
            Didn&apos;t receive the email? Check your spam folder or try signing up again.
          </p>
        </div>
      </div>
    );
  }

  if (step === "community") {
    return (
      <div className="min-h-screen bg-prism-bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-prism-accent-live/10 mb-6">
            <svg
              className="w-8 h-8 text-prism-accent-live"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="font-body text-xl font-bold text-prism-text-primary mb-2">
            Account Created
          </h1>
          <p className="text-sm text-prism-text-secondary mb-6">
            You&apos;re at Verification Level 1. Start exploring
            perspectives from communities across the country.
          </p>

          <div className="bg-prism-bg-surface border border-prism-border rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-prism-text-dim uppercase tracking-wider mb-2">
              What you can do now
            </p>
            <ul className="space-y-2">
              {[
                "Browse all topics and perspectives",
                "React to perspectives",
                "Bookmark and share content",
                "Discover how communities see events",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-prism-text-primary"
                >
                  <svg
                    className="w-4 h-4 text-prism-accent-live mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/onboarding"
            className="inline-flex px-6 py-2.5 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-primary/90 transition-colors"
          >
            Continue to Onboarding
          </Link>

          <p className="text-xs text-prism-text-dim mt-4">
            Verify your location to unlock posting and connections (Level 2)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-prism-bg-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows — community colors */}
      <div className="absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-prism-community-diaspora/[0.08] blur-3xl animate-pulse" style={{ animationDuration: "10s" }} />
      <div className="absolute bottom-1/3 -left-24 w-80 h-80 rounded-full bg-prism-accent-primary/[0.08] blur-3xl animate-pulse" style={{ animationDuration: "8s", animationDelay: "2s" }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-prism-community-rural/[0.05] blur-3xl" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <PrismWordmark size="lg" />
          <h1 className="font-display text-2xl font-bold text-prism-text-primary mt-6 tracking-tight">
            Join PRISM
          </h1>
          <p className="text-sm text-prism-text-secondary mt-1">
            See the world through every community&apos;s eyes
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Signup form */}
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
              htmlFor="username"
              className="block text-xs font-medium text-prism-text-secondary mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourusername"
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 rounded-xl bg-prism-bg-surface border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary focus:bg-prism-bg-elevated/50 focus:shadow-[0_0_0_3px_rgba(212,149,107,0.1)] transition-all"
            />
            <p className="text-[11px] text-prism-text-dim mt-1">
              At least 8 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-prism-accent-primary text-white text-sm font-medium hover:shadow-[0_0_24px_rgba(212,149,107,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

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

        {/* Login link */}
        <p className="text-center text-sm text-prism-text-dim mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-prism-accent-primary hover:underline"
          >
            Sign in
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
