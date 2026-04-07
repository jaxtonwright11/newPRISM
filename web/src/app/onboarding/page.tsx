"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PrismWordmark } from "@/components/prism-wordmark";
import { prismEvents } from "@/lib/posthog";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

type Step = 1 | 2 | 3 | 4;

interface SuggestedCommunity {
  id: string;
  name: string;
  region: string;
  community_type: string;
  color_hex: string;
  perspective_count: number;
  member_count: number;
  sample_quote: string | null;
  distance_km: number | null;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [location, setLocation] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [perspective, setPerspective] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activePrompt, setActivePrompt] = useState<{ prompt_text: string; topic_name?: string } | null>(null);

  // Community matching state
  const [suggestedCommunities, setSuggestedCommunities] = useState<SuggestedCommunity[]>([]);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [followingInProgress, setFollowingInProgress] = useState(false);

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

  // Detect location
  useEffect(() => {
    if ("geolocation" in navigator) {
      setDetecting(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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

  // Fetch community suggestions when moving to step 2
  async function fetchSuggestions() {
    setLoadingSuggestions(true);
    try {
      const params = userCoords ? `?lat=${userCoords.lat}&lng=${userCoords.lng}` : "";
      const res = await fetch(`/api/communities/suggest${params}`);
      const data = await res.json();
      setSuggestedCommunities(data.suggestions ?? []);
    } catch {
      setSuggestedCommunities([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function toggleCommunity(id: string) {
    setSelectedCommunityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }

  async function followSelectedAndContinue() {
    if (!session?.access_token || selectedCommunityIds.size === 0) {
      setStep(3);
      return;
    }

    setFollowingInProgress(true);
    try {
      await Promise.all(
        Array.from(selectedCommunityIds).map((community_id) =>
          fetch("/api/communities/follow", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ community_id }),
          })
        )
      );
    } catch {
      // Non-critical
    } finally {
      setFollowingInProgress(false);
      setStep(3);
    }
  }

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
      setStep(4);
    }
  }

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center pt-8 pb-4">
        <PrismWordmark size="md" />
      </header>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
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
        {/* Step 1: Location */}
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
                fetchSuggestions();
                setStep(2);
              }}
              disabled={!location.trim()}
              className="w-full max-w-sm py-3 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-base disabled:opacity-40 transition-opacity"
            >
              This is me
            </button>

            <button
              onClick={() => { fetchSuggestions(); setStep(2); }}
              className="mt-3 text-sm text-[var(--text-secondary)] font-body hover:text-[var(--text-primary)] transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2: Community Matching */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center flex-1">
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
              Communities near you and beyond
            </h1>
            <p className="text-base text-[var(--text-secondary)] font-body mb-6 max-w-sm">
              Follow 1-3 communities to fill your feed with real perspectives.
            </p>

            {loadingSuggestions ? (
              <div className="w-full max-w-sm space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 bg-[var(--bg-elevated)] rounded-xl animate-shimmer" />
                ))}
              </div>
            ) : suggestedCommunities.length === 0 ? (
              <div className="w-full max-w-sm bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-elevated)] p-6 text-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/15 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="12" cy="12" r="8" strokeDasharray="4 3" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  Communities are being formed.
                </p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  You&apos;ll be notified when communities near you join. In the meantime, you can register your own.
                </p>
                <button
                  onClick={() => router.push("/apply")}
                  className="text-xs text-[var(--accent-primary)] font-medium hover:underline"
                >
                  Register a community
                </button>
              </div>
            ) : (
              <div className="w-full max-w-sm space-y-2.5 mb-6">
                {suggestedCommunities.map((c, i) => {
                  const isSelected = selectedCommunityIds.has(c.id);
                  const color = COMMUNITY_COLORS[c.community_type as CommunityType] ?? c.color_hex;
                  const isNearby = i < 2 && c.distance_km !== null;

                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCommunity(c.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/8"
                          : "border-[var(--bg-elevated)] bg-[var(--bg-surface)] hover:border-[var(--text-dim)]/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Color dot */}
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {c.name}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider flex-shrink-0"
                              style={{ backgroundColor: color + "18", color }}
                            >
                              {c.community_type}
                            </span>
                            {isNearby && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-live)]/10 text-[var(--accent-live)] font-medium flex-shrink-0">
                                Nearby
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--text-dim)] mb-1.5">
                            <span>{c.region}</span>
                            <span>·</span>
                            <span className="font-mono">{c.member_count} member{c.member_count !== 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span className="font-mono">{c.perspective_count} perspective{c.perspective_count !== 1 ? "s" : ""}</span>
                          </div>
                          {c.sample_quote && (
                            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 italic">
                              &ldquo;{c.sample_quote}&rdquo;
                            </p>
                          )}
                        </div>
                        {/* Check indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          isSelected
                            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                            : "border-[var(--text-dim)]/30"
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedCommunityIds.size > 0 && (
              <p className="text-xs text-[var(--accent-primary)] font-body mb-4">
                {selectedCommunityIds.size} communit{selectedCommunityIds.size === 1 ? "y" : "ies"} selected
              </p>
            )}

            <button
              onClick={followSelectedAndContinue}
              disabled={followingInProgress}
              className="w-full max-w-sm py-3 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-base disabled:opacity-40 transition-opacity"
            >
              {followingInProgress
                ? "Following..."
                : selectedCommunityIds.size > 0
                  ? "Follow and continue"
                  : "Continue without following"}
            </button>

            <button
              onClick={() => setStep(3)}
              className="mt-3 text-sm text-[var(--text-secondary)] font-body hover:text-[var(--text-primary)] transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 3: First Perspective */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center flex-1">
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
              {activePrompt ? activePrompt.prompt_text : "What's one thing about your city that outsiders don't understand?"}
            </h1>
            <p className="text-base text-[var(--text-secondary)] font-body mb-4 max-w-sm">
              {activePrompt?.topic_name
                ? `This week's topic: ${activePrompt.topic_name}. Share your community's perspective.`
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

        {/* Step 4: Welcome */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center flex-1 justify-center">
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
              Welcome to PRISM.
            </h1>
            <p className="text-base text-[var(--text-secondary)] font-body mb-4 max-w-sm">
              Your perspective is live. Now see how other communities experience the same events.
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
