"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PrismWordmark } from "@/components/prism-wordmark";
import { prismEvents } from "@/lib/posthog";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [location, setLocation] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [perspective, setPerspective] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activePrompt, setActivePrompt] = useState<{ prompt_text: string; topic_name?: string } | null>(null);
  const { session } = useAuth();
  const router = useRouter();
  const startTime = useRef(Date.now());

  // Fetch active perspective prompt
  useEffect(() => {
    fetch("/api/prompts/active")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.prompt) setActivePrompt(data.prompt); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      setDetecting(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?types=neighborhood,place&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            const data = await res.json();
            const place = data.features?.[0]?.text || data.features?.[0]?.place_name;
            if (place) setLocation(place);
          } catch {
            // ignore
          } finally {
            setDetecting(false);
          }
        },
        () => setDetecting(false)
      );
    }
  }, []);

  async function handlePostPerspective() {
    if (!perspective.trim() || !session?.access_token) return;
    setSubmitting(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: perspective,
          post_type: "permanent",
        }),
      });
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
      prismEvents.onboardingAhaMoment(location, Date.now() - startTime.current);
      setStep(3);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center pt-8 pb-4">
        <PrismWordmark size="md" />
      </header>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              s === step
                ? "bg-[var(--accent-primary)]"
                : s < step
                  ? "bg-[var(--accent-primary)]/40"
                  : "bg-[var(--bg-elevated)]"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 flex flex-col">
        {step === 1 && (
          <div className="flex flex-col items-center text-center flex-1">
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
              What city are you in?
            </h1>
            <p className="text-base text-[var(--text-secondary)] font-body mb-8 max-w-sm">
              PRISM connects you to perspectives from your community and beyond.
            </p>

            <div className="w-full max-w-sm mb-6">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={detecting ? "Detecting your location..." : "Enter your city"}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] text-[var(--text-primary)] font-body placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
              />
            </div>

            <button
              onClick={async () => {
                if (session?.access_token && location.trim()) {
                  try {
                    await fetch("/api/user/profile", {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({ location_text: location.trim() }),
                    });
                  } catch {
                    // Non-critical
                  }
                }
                setStep(2);
              }}
              disabled={!location.trim()}
              className="w-full max-w-sm py-3 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-base disabled:opacity-40 transition-opacity"
            >
              This is me
            </button>

            <button
              onClick={() => setStep(2)}
              className="mt-3 text-sm text-[var(--text-secondary)] font-body hover:text-[var(--text-primary)] transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center flex-1">
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
              {activePrompt ? activePrompt.prompt_text : "What\u2019s one thing about your city that outsiders don\u2019t understand?"}
            </h1>
            <p className="text-base text-[var(--text-secondary)] font-body mb-4 max-w-sm">
              {activePrompt?.topic_name
                ? `This week\u2019s topic: ${activePrompt.topic_name}. Share your community\u2019s perspective.`
                : "This becomes your first perspective on PRISM."}
            </p>
            <p className="text-xs text-[var(--text-dim)] font-body mb-6 max-w-sm">
              A perspective is a firsthand account of how your community experiences an event or issue.
            </p>

            {location && (
              <div className="flex items-center gap-1.5 mb-4 text-xs text-[var(--text-dim)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {location}
              </div>
            )}

            <textarea
              value={perspective}
              onChange={(e) => setPerspective(e.target.value.slice(0, 500))}
              placeholder="Everyone thinks this place is... but actually..."
              className="w-full max-w-sm h-32 resize-none px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] text-[var(--text-primary)] font-body placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-colors mb-4"
              autoFocus
            />

            <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-6 font-mono">
              {perspective.length}/500
            </div>

            <button
              onClick={session ? handlePostPerspective : () => router.push("/signup")}
              disabled={!perspective.trim() || submitting}
              className="w-full max-w-sm py-3 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-base disabled:opacity-40 transition-opacity"
            >
              {submitting ? "Posting..." : session ? "Post" : "Sign up to post"}
            </button>

            <button
              onClick={() => router.push("/feed")}
              className="mt-3 text-sm text-[var(--text-secondary)] font-body hover:text-[var(--text-primary)] transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center flex-1 justify-center">
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
              Welcome to PRISM.
            </h1>
            <p className="text-base text-[var(--text-secondary)] font-body mb-4 max-w-sm">
              Your perspective is live. Now see how other communities experience the same world differently.
            </p>
            <button
              onClick={() => router.push("/feed")}
              className="w-full max-w-sm py-3 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-base mb-3"
            >
              Start exploring
            </button>
            <button
              onClick={() => router.push("/map")}
              className="text-sm text-[var(--text-secondary)] font-body hover:text-[var(--text-primary)] transition-colors"
            >
              Open the map instead
            </button>

            <div className="mt-8 pt-6 border-t border-[var(--bg-elevated)] w-full max-w-sm">
              <p className="text-xs text-[var(--text-dim)] mb-2 text-center">
                Want to represent your community on PRISM?
              </p>
              <button
                onClick={() => router.push("/apply")}
                className="w-full py-2.5 rounded-lg border border-[var(--bg-elevated)] text-sm text-[var(--text-secondary)] font-body hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/30 transition-all"
              >
                Register a community
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
