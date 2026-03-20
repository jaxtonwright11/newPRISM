"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPlaceholder } from "@/components/map-placeholder";
import { SEED_PERSPECTIVES, SEED_TOPICS } from "@/lib/seed-data";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

type OnboardingStep = "map" | "perspectives" | "signup";

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("map");
  const [activeTopic] = useState(SEED_TOPICS.find((t) => t.status === "hot"));
  const [showPerspectives, setShowPerspectives] = useState(false);

  const topicPerspectives = SEED_PERSPECTIVES.filter(
    (p) => p.topic_slug === activeTopic?.slug
  ).slice(0, 2);

  useEffect(() => {
    if (step === "perspectives") {
      const timer = setTimeout(() => setShowPerspectives(true), 300);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-prism-bg-primary">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapPlaceholder showPersonalPin={false} />
      </div>

      {/* Dark gradient overlay from bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-prism-bg-primary via-prism-bg-primary/80 to-transparent pointer-events-none" />

      {/* Step 1: Map with active topic prompt */}
      {step === "map" && (
        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-6 animate-fade-in">
          {/* Active topic indicator */}
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-prism-bg-primary/80 backdrop-blur-md px-3 py-2 rounded-full border border-prism-border z-10">
            <span className="w-2 h-2 rounded-full bg-prism-accent-live animate-pulse-slow" />
            <span className="text-xs font-semibold text-prism-accent-live uppercase tracking-wide">
              Active Now
            </span>
          </div>

          {/* PRISM logo */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">
                P
              </span>
            </div>
            <span className="font-display text-base font-bold text-prism-text-primary">
              PRISM
            </span>
          </div>

          {/* Topic card */}
          {activeTopic && (
            <div className="max-w-lg mx-auto w-full">
              <div className="bg-prism-bg-secondary/90 backdrop-blur-lg border border-prism-border rounded-2xl p-5 mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-prism-accent-active mb-2">
                  Happening Now
                </p>
                <h2 className="font-display text-xl font-bold text-prism-text-primary mb-2">
                  {activeTopic.title}
                </h2>
                <p className="text-sm text-prism-text-secondary leading-relaxed mb-3">
                  {activeTopic.summary}
                </p>
                <div className="flex items-center gap-3 text-xs text-prism-text-dim font-mono">
                  <span>{activeTopic.community_count} communities</span>
                  <span>·</span>
                  <span>
                    {activeTopic.perspective_count} perspectives
                  </span>
                </div>
              </div>

              <button
                onClick={() => setStep("perspectives")}
                className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-semibold hover:bg-prism-accent-active/90 transition-colors flex items-center justify-center gap-2"
              >
                <span>
                  See how {activeTopic.community_count} communities experience
                  this
                </span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Perspectives slide up */}
      {step === "perspectives" && (
        <div className="absolute inset-0 flex flex-col justify-end pb-8 px-4 md:px-6">
          {/* Topic label */}
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-prism-bg-primary/80 backdrop-blur-md px-3 py-2 rounded-full border border-prism-border z-10">
            <span className="w-2 h-2 rounded-full bg-prism-accent-live animate-pulse-slow" />
            <span className="text-xs font-medium text-prism-text-primary">
              {activeTopic?.title}
            </span>
          </div>

          {/* PRISM logo */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">
                P
              </span>
            </div>
          </div>

          {/* Perspective cards */}
          <div className="max-w-lg mx-auto w-full space-y-3">
            {topicPerspectives.map((perspective, i) => {
              const color =
                COMMUNITY_COLORS[
                  perspective.community.community_type as CommunityType
                ];
              return (
                <div
                  key={perspective.id}
                  className={`bg-prism-bg-secondary/95 backdrop-blur-lg border border-prism-border rounded-xl p-5 transition-all duration-500 ${
                    showPerspectives
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{
                    borderLeftWidth: "3px",
                    borderLeftColor: color,
                    transitionDelay: `${i * 150}ms`,
                  }}
                >
                  {/* Community header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: color + "20",
                        color: color,
                      }}
                    >
                      {perspective.community.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-prism-text-primary">
                          {perspective.community.name}
                        </span>
                        {perspective.community.verified && (
                          <svg
                            className="w-3.5 h-3.5 text-prism-accent-verified"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] text-prism-text-dim">
                        {perspective.community.region}
                      </span>
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="font-display italic text-base leading-relaxed text-prism-text-primary">
                    &ldquo;{perspective.quote}&rdquo;
                  </blockquote>
                </div>
              );
            })}

            {/* CTA to signup */}
            <div
              className={`text-center pt-4 transition-all duration-500 ${
                showPerspectives
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <button
                onClick={() => setStep("signup")}
                className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-semibold hover:bg-prism-accent-active/90 transition-colors"
              >
                Connect with these communities
              </button>
              <Link
                href="/"
                className="inline-block mt-3 text-xs text-prism-text-dim hover:text-prism-text-secondary transition-colors"
              >
                Continue exploring without an account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Signup prompt */}
      {step === "signup" && (
        <div className="absolute inset-0 flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-prism-bg-primary/80 backdrop-blur-md" />

          <div className="relative max-w-sm w-full text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora mb-5">
              <span className="text-white font-display font-bold text-2xl">
                P
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold text-prism-text-primary mb-2">
              See every perspective
            </h2>
            <p className="text-sm text-prism-text-secondary mb-8 leading-relaxed">
              Create a free account to follow communities, react to
              perspectives, and connect with people who see the world
              differently.
            </p>

            <div className="space-y-3">
              <Link
                href="/signup"
                className="block w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-semibold hover:bg-prism-accent-active/90 transition-colors"
              >
                Create account
              </Link>

              <Link
                href="/login"
                className="block w-full py-3 rounded-xl bg-prism-bg-secondary border border-prism-border text-prism-text-primary text-sm font-medium hover:bg-prism-bg-elevated transition-colors"
              >
                Sign in
              </Link>
            </div>

            <Link
              href="/"
              className="inline-block mt-6 text-xs text-prism-text-dim hover:text-prism-text-secondary transition-colors"
            >
              ← Keep exploring without an account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
