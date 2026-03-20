"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Supabase auth will be wired here when env vars are configured
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-screen bg-prism-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora mb-4">
            <span className="text-white font-display font-bold text-xl">P</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-prism-text-primary">
            Welcome back
          </h1>
          <p className="text-sm text-prism-text-secondary mt-1">
            Sign in to continue exploring perspectives
          </p>
        </div>

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
              className="w-full px-3 py-2.5 rounded-lg bg-prism-bg-secondary border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-2 focus:ring-prism-accent-active/50 focus:border-prism-accent-active transition-all"
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
              className="w-full px-3 py-2.5 rounded-lg bg-prism-bg-secondary border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-2 focus:ring-prism-accent-active/50 focus:border-prism-accent-active transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-prism-accent-active text-white text-sm font-medium hover:bg-prism-accent-active/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-prism-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-prism-bg-primary px-3 text-prism-text-dim">
              or continue with
            </span>
          </div>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          className="w-full py-2.5 rounded-lg bg-prism-bg-secondary border border-prism-border text-sm text-prism-text-primary hover:bg-prism-bg-elevated transition-colors flex items-center justify-center gap-2"
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
            className="text-prism-accent-active hover:underline"
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
            ← Back to exploring
          </Link>
        </p>
      </div>
    </div>
  );
}
