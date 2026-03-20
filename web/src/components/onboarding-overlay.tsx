"use client";

import { useState, useEffect } from "react";

const ONBOARDING_KEY = "prism_onboarded_v1";

const AHA_PERSPECTIVES = [
  {
    community: "Detroit Auto Workers",
    region: "Detroit, MI",
    type: "civic",
    color: "#4A9EFF",
    quote:
      "An EV engine has seventeen moving parts. A gas engine has two thousand. You don't need a math degree to know what that means for our jobs.",
  },
  {
    community: "Rural Appalachia",
    region: "West Virginia",
    type: "rural",
    color: "#F59E0B",
    quote:
      "The nearest charging station is ninety miles away. Tell me again how EVs are the future for everyone.",
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
}

type OnboardingStep = "welcome" | "map" | "topic" | "perspectives" | "aha";

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      setTimeout(() => setVisible(true), 600);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
    setTimeout(onComplete, 300);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-prism-bg-primary/95 backdrop-blur-md" />

      <div className="relative w-full max-w-sm animate-fade-in">
        {step === "welcome" && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora mb-6 shadow-lg shadow-prism-accent-active/30">
              <span className="text-white font-display font-bold text-2xl">P</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-prism-text-primary mb-3">
              Welcome to PRISM
            </h1>
            <p className="text-base text-prism-text-secondary leading-relaxed mb-8">
              Why can&apos;t we understand each other?
              <br />
              <span className="text-prism-text-primary">
                PRISM shows you how communities across the country experience the same events.
              </span>
            </p>
            <button
              onClick={() => setStep("map")}
              className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-medium hover:bg-prism-accent-active/90 transition-colors shadow-lg shadow-prism-accent-active/30"
            >
              Show me
            </button>
          </div>
        )}

        {step === "map" && (
          <div className="text-center">
            <div className="w-full aspect-video rounded-xl bg-prism-map-ocean border border-prism-border mb-6 relative overflow-hidden">
              {/* Mock map with glowing pins */}
              <div className="absolute inset-0 bg-gradient-to-br from-prism-map-ocean to-prism-map-land" />
              {[
                { x: 42, y: 45, color: "#4A9EFF", size: 14 },
                { x: 25, y: 55, color: "#F59E0B", size: 10 },
                { x: 35, y: 62, color: "#A855F7", size: 12 },
                { x: 55, y: 48, color: "#10B981", size: 9 },
                { x: 70, y: 42, color: "#06B6D4", size: 11 },
                { x: 20, y: 40, color: "#F97316", size: 8 },
              ].map((pin, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className="rounded-full animate-pulse-glow"
                    style={{
                      width: pin.size * 3,
                      height: pin.size * 3,
                      backgroundColor: pin.color + "20",
                      position: "absolute",
                      transform: "translate(-50%, -50%)",
                      left: "50%",
                      top: "50%",
                    }}
                  />
                  <div
                    className="rounded-full"
                    style={{
                      width: pin.size,
                      height: pin.size,
                      backgroundColor: pin.color,
                      boxShadow: `0 0 ${pin.size}px ${pin.color}80`,
                    }}
                  />
                </div>
              ))}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-prism-bg-primary/80 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-prism-accent-live animate-pulse-slow" />
                <span className="text-[9px] font-semibold tracking-widest text-prism-accent-live">LIVE</span>
              </div>
            </div>
            <h2 className="font-display text-xl font-bold text-prism-text-primary mb-2">
              A live map of perspectives
            </h2>
            <p className="text-sm text-prism-text-secondary leading-relaxed mb-6">
              Every glowing dot is a community actively discussing current events. Each color represents a community type — not a political side.
            </p>
            <button
              onClick={() => setStep("topic")}
              className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-medium hover:bg-prism-accent-active/90 transition-colors"
            >
              See a live topic
            </button>
          </div>
        )}

        {step === "topic" && (
          <div className="text-center">
            <div className="w-full p-4 rounded-xl bg-prism-bg-secondary border border-prism-border mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-prism-accent-active/20 text-prism-accent-active">
                  TRENDING
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-prism-text-primary mb-1">
                Electric Vehicle Transition
              </h3>
              <p className="text-sm text-prism-text-secondary">
                Auto workers, rural drivers, and policy makers see the EV shift through very different lenses.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-mono text-prism-text-dim">9 perspectives</span>
                <span className="text-xs font-mono text-prism-text-dim">4 communities</span>
              </div>
            </div>
            <p className="text-sm text-prism-text-secondary mb-6 leading-relaxed">
              When you select a topic, communities across the country light up on the map — and their perspectives load below.
            </p>
            <button
              onClick={() => setStep("perspectives")}
              className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-medium hover:bg-prism-accent-active/90 transition-colors"
            >
              Read two perspectives
            </button>
          </div>
        )}

        {step === "perspectives" && (
          <div>
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-4">
              Same topic. Different worlds.
            </p>
            <div className="space-y-3 mb-6">
              {AHA_PERSPECTIVES.map((p, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-prism-border bg-prism-bg-secondary p-4"
                  style={{ borderLeftWidth: "3px", borderLeftColor: p.color }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: p.color + "20", color: p.color }}
                    >
                      {p.community.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-prism-text-primary">{p.community}</p>
                      <p className="text-[10px] text-prism-text-dim">{p.region}</p>
                    </div>
                  </div>
                  <blockquote className="font-display italic text-sm leading-relaxed text-prism-text-primary">
                    &ldquo;{p.quote}&rdquo;
                  </blockquote>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep("aha")}
              className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-medium hover:bg-prism-accent-active/90 transition-colors"
            >
              I see it
            </button>
          </div>
        )}

        {step === "aha" && (
          <div className="text-center">
            <div className="text-5xl mb-5">💡</div>
            <h2 className="font-display text-2xl font-bold text-prism-text-primary mb-3">
              That&apos;s PRISM.
            </h2>
            <p className="text-sm text-prism-text-secondary leading-relaxed mb-4">
              Same event. Two communities. Two completely different realities.
              Neither wrong. Both true.
            </p>
            <p className="text-sm text-prism-text-primary font-medium mb-8">
              Explore all 12 communities and 6 live topics — or connect with someone from a community you just read about.
            </p>
            <button
              onClick={handleComplete}
              className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-medium hover:bg-prism-accent-active/90 transition-colors shadow-lg shadow-prism-accent-active/30"
            >
              Start exploring
            </button>
            <p className="text-xs text-prism-text-dim mt-3">No account needed to browse</p>
          </div>
        )}

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {(["welcome", "map", "topic", "perspectives", "aha"] as OnboardingStep[]).map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-6 bg-prism-accent-active"
                  : "w-1.5 bg-prism-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
