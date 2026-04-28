"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { PrismWordmark } from "@/components/prism-wordmark";
import { isValidSupabaseUrl } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!isValidSupabaseUrl(url) || !anonKey) {
      setError("Password reset is not configured");
      setLoading(false);
      return;
    }

    const supabase = createClient(url, anonKey);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-prism-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <PrismWordmark size="lg" />
          <h1 className="font-display text-2xl font-bold text-prism-text-primary mt-6 tracking-tight">
            Reset your password
          </h1>
          <p className="text-sm text-prism-text-secondary mt-1 font-body">
            We&apos;ll send you a link to reset it
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-xl bg-prism-accent-live/10 border border-prism-accent-live/20">
              <p className="text-sm text-prism-accent-live font-medium">Check your email</p>
              <p className="text-xs text-prism-text-secondary mt-1">
                We sent a password reset link to <strong className="text-prism-text-primary">{email}</strong>
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm text-prism-accent-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-prism-bg-surface border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary focus:shadow-[0_0_0_3px_rgba(212,149,107,0.1)] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-prism-accent-primary text-white text-sm font-medium hover:shadow-[0_0_24px_rgba(212,149,107,0.3)] transition-all disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="text-center text-sm text-prism-text-dim mt-6">
              Remember your password?{" "}
              <Link href="/login" className="text-prism-accent-primary hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
