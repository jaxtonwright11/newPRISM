"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

const ONBOARDING_KEY = "prism_onboarding_seen";

interface AhaPerspective {
  id: string;
  quote: string;
  context: string | null;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
}

interface OnboardingAhaProps {
  activeTopic: { title: string; summary: string | null; community_count: number; perspective_count: number } | null;
  perspectives: AhaPerspective[];
}

type AhaStep = "prompt" | "perspectives" | "signup" | "done";

export function OnboardingAha({ activeTopic, perspectives }: OnboardingAhaProps) {
  const [step, setStep] = useState<AhaStep>("prompt");
  const [visible, setVisible] = useState(false);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (step === "perspectives") {
      const timer = setTimeout(() => setShowCards(true), 300);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_KEY, "1");
    }
  };

  if (!visible || !activeTopic) return null;

  // Step 1: "Tap to see" prompt
  if (step === "prompt") {
    return (
      <div className="absolute inset-0 z-20 flex flex-col justify-end pointer-events-none">
        {/* ACTIVE NOW indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-prism-bg-primary/85 backdrop-blur-md px-3 py-2 rounded-full border border-prism-border pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-prism-accent-live animate-pulse-slow" />
          <span className="text-[10px] font-semibold text-prism-accent-live uppercase tracking-wide">
            Active Now
          </span>
        </div>

        {/* Bottom prompt card */}
        <div className="p-4 pointer-events-auto">
          <div className="max-w-lg mx-auto">
            <div className="bg-prism-bg-secondary/95 backdrop-blur-lg border border-prism-border rounded-2xl p-5 mb-3 shadow-xl">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-prism-accent-active mb-2">
                Happening Now
              </p>
              <h3 className="font-display text-lg font-bold text-prism-text-primary mb-1.5">
                {activeTopic.title}
              </h3>
              {activeTopic.summary && (
                <p className="text-xs text-prism-text-secondary leading-relaxed mb-3">
                  {activeTopic.summary}
                </p>
              )}
              <div className="flex items-center gap-3 text-[10px] text-prism-text-dim font-mono">
                <span>{activeTopic.community_count} communities</span>
                <span>·</span>
                <span>{activeTopic.perspective_count} perspectives</span>
              </div>
            </div>

            <button
              onClick={() => setStep("perspectives")}
              className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-semibold hover:bg-prism-accent-active/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-prism-accent-active/20"
            >
              Tap to see how communities are experiencing this
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>

            <button
              onClick={dismiss}
              className="w-full mt-2 text-center text-[11px] text-prism-text-dim hover:text-prism-text-secondary transition-colors py-1"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Two perspective cards slide up
  if (step === "perspectives") {
    const twoCards = perspectives.slice(0, 2);
    return (
      <div className="absolute inset-0 z-20 flex flex-col justify-end pointer-events-none">
        {/* Topic label */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-prism-bg-primary/85 backdrop-blur-md px-3 py-2 rounded-full border border-prism-border pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-prism-accent-live animate-pulse-slow" />
          <span className="text-xs font-medium text-prism-text-primary truncate max-w-[200px]">
            {activeTopic.title}
          </span>
        </div>

        <div className="p-4 pointer-events-auto">
          <div className="max-w-lg mx-auto space-y-3">
            {twoCards.map((p, i) => {
              const color = COMMUNITY_COLORS[p.community.community_type];
              return (
                <div
                  key={p.id}
                  className={`bg-prism-bg-secondary/95 backdrop-blur-lg border border-prism-border rounded-xl p-5 shadow-xl transition-all duration-500 ${
                    showCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{
                    borderLeftWidth: "3px",
                    borderLeftColor: color,
                    transitionDelay: `${i * 150}ms`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      {p.community.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-prism-text-primary">
                          {p.community.name}
                        </span>
                        {p.community.verified && (
                          <svg className="w-3.5 h-3.5 text-prism-accent-verified" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[10px] text-prism-text-dim">{p.community.region}</span>
                    </div>
                  </div>
                  <blockquote className="font-display italic text-base leading-relaxed text-prism-text-primary">
                    &ldquo;{p.quote}&rdquo;
                  </blockquote>
                </div>
              );
            })}

            {/* Soft signup nudge */}
            <div
              className={`text-center pt-2 transition-all duration-500 ${
                showCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <button
                onClick={() => setStep("signup")}
                className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-semibold hover:bg-prism-accent-active/90 transition-colors shadow-lg"
              >
                Connect with these communities
              </button>
              <button
                onClick={dismiss}
                className="inline-block mt-3 text-xs text-prism-text-dim hover:text-prism-text-secondary transition-colors"
              >
                Continue exploring without an account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Soft signup nudge
  if (step === "signup") {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div className="absolute inset-0 bg-prism-bg-primary/70 backdrop-blur-md pointer-events-auto" onClick={dismiss} />

        <div className="relative max-w-sm w-full text-center px-4 pointer-events-auto animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora mb-5">
            <span className="text-white font-display font-bold text-2xl">P</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-prism-text-primary mb-2">
            See every perspective
          </h2>
          <p className="text-sm text-prism-text-secondary mb-8 leading-relaxed">
            Create a free account to follow communities, react to perspectives, and connect with people who see the world differently.
          </p>

          <div className="space-y-3">
            <Link
              href="/signup"
              className="block w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-semibold hover:bg-prism-accent-active/90 transition-colors"
              onClick={dismiss}
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl bg-prism-bg-secondary border border-prism-border text-prism-text-primary text-sm font-medium hover:bg-prism-bg-elevated transition-colors"
              onClick={dismiss}
            >
              Sign in
            </Link>
          </div>

          <button
            onClick={dismiss}
            className="inline-block mt-6 text-xs text-prism-text-dim hover:text-prism-text-secondary transition-colors"
          >
            Keep exploring without an account
          </button>
        </div>
      </div>
    );
  }

  return null;
}
