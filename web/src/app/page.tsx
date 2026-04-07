"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { PrismWordmark } from "@/components/prism-wordmark";
import { ShimmerButton } from "@/components/shimmer-button";
import type { Community, Topic, CommunityType } from "@shared/types";

function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-[var(--text-primary)] font-body font-medium">
          You&apos;re on the list. We&apos;ll be in touch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
        placeholder="you@example.com"
        className="flex-1 bg-[#0D1117] border border-[rgba(212,149,107,0.4)] rounded-lg px-4 py-3 text-white text-sm font-body placeholder-[#5C6370] focus:border-[#D4956B] focus:outline-none transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-body font-medium hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 transition-all disabled:opacity-50 shrink-0 min-h-[44px]"
      >
        {status === "loading" ? "\u2026" : "Get early access"}
      </button>
      {status === "error" && errorMsg && (
        <p className="text-xs text-red-400 font-body sm:col-span-2 text-center sm:text-left mt-1">{errorMsg}</p>
      )}
    </form>
  );
}

/** Wrapper that renders children with whileInView animation, or static if reduced motion is preferred. */
function RevealOnScroll({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

const MapPlaceholder = dynamic(
  () => import("@/components/map-placeholder").then((mod) => mod.MapPlaceholder),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#1A1208]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628]/40 to-[#1A1208] animate-pulse" />
      </div>
    ),
  }
);

const PerspectiveComparison = dynamic(
  () => import("@/components/perspective-comparison").then((mod) => mod.PerspectiveComparison),
  { ssr: false }
);

interface AhaPerspective {
  id: string;
  quote: string;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
  };
}

type AhaStep = "map" | "topic" | "perspectives" | "signup";

export default function Home() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [perspectives, setPerspectives] = useState<AhaPerspective[]>([]);
  const [step, setStep] = useState<AhaStep>("map");

  // Authenticated users go straight to feed
  useEffect(() => {
    if (!authLoading && session) {
      router.replace("/feed");
    }
  }, [authLoading, session, router]);

  // Load communities and topics
  useEffect(() => {
    if (session) return; // Don't fetch if redirecting

    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => setCommunities(data.communities ?? data ?? []))
      .catch(() => {});

    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        const topics = data.topics ?? [];
        const hot = topics.find((t: Topic) => t.status === "hot");
        const trending = topics.find((t: Topic) => t.status === "trending");
        setActiveTopic(hot ?? trending ?? topics[0] ?? null);
      })
      .catch(() => {});
  }, [session]);

  // When topic is tapped, fetch perspectives for it
  const handleTopicTap = async () => {
    if (!activeTopic) return;
    setStep("topic");

    try {
      const res = await fetch(`/api/topics/${activeTopic.slug}`);
      const data = await res.json();
      const topicPerspectives = data.perspectives ?? [];

      // Get 2 perspectives from different communities
      const seen = new Set<string>();
      const diverse: AhaPerspective[] = [];
      for (const p of topicPerspectives) {
        const communityName = p.community?.name;
        if (communityName && !seen.has(communityName) && diverse.length < 2) {
          seen.add(communityName);
          diverse.push({
            id: p.id,
            quote: p.quote,
            community: {
              name: p.community.name,
              region: p.community.region,
              community_type: p.community.community_type,
              color_hex: p.community.color_hex,
            },
          });
        }
      }
      setPerspectives(diverse);

      // After a moment, show the perspectives
      setTimeout(() => setStep("perspectives"), 600);
    } catch {
      setStep("perspectives");
    }
  };

  // Don't render for authed users
  if (authLoading || session) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-32 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--accent-primary)]/30 rounded-full animate-shimmer" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  return (
    <div id="main-content" className="bg-[var(--bg-base)] flex flex-col relative">
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — full viewport, map background
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Map background */}
        <div className="absolute inset-0 z-0">
          <MapPlaceholder
            communities={communities}
            isAuthenticated={false}
            hideOverlays
            enableAutoPan
          />
        </div>

        {/* Radial gradient overlay — dark at text center, transparent at edges */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center bottom, rgba(10, 14, 20, 0.55) 0%, rgba(10, 14, 20, 0.30) 45%, transparent 72%)",
          }}
        />
        {/* Mobile: slightly stronger overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none md:hidden"
          style={{
            background: "radial-gradient(ellipse at center bottom, rgba(10, 14, 20, 0.55) 0%, rgba(10, 14, 20, 0.35) 40%, transparent 68%)",
          }}
        />

        {/* Nav bar */}
        <header className="relative z-20 flex items-center justify-between px-4 md:px-6 pt-4 backdrop-blur-sm bg-black/20">
          <PrismWordmark size="md" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/login")}
              className="hidden md:flex px-4 py-2.5 text-sm font-body font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] items-center"
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-body font-medium hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 transition-all min-h-[44px] flex items-center"
            >
              <span className="md:hidden">Join</span>
              <span className="hidden md:inline">Sign up</span>
            </button>
          </div>
        </header>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Hero text — bottom center */}
        <div className="relative z-20 px-4 pb-6 md:pb-12 max-w-2xl mx-auto w-full text-center">
          {/* Credibility line — hidden on mobile */}
          <p className="hidden md:block text-xs tracking-widest uppercase font-body text-[var(--accent-primary)]/60 mb-5">
            UC Berkeley Founded
          </p>

          <h1
            className="font-display font-semibold md:font-bold text-[1.65rem] md:text-5xl lg:text-6xl text-[var(--text-primary)] mb-4 md:mb-6 leading-tight"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
          >
            See how your community actually experiences the world
          </h1>

          <p
            className="text-sm md:text-lg text-[var(--text-secondary)] font-body mb-6 md:mb-8 max-w-xl mx-auto leading-relaxed"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
          >
            PRISM maps perspectives from communities across America on the events shaping all of us, neighborhood by neighborhood, in their own words.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <ShimmerButton
              size="lg"
              onClick={() => router.push("/signup")}
              fullWidth
              className="sm:w-auto"
            >
              Share your perspective
            </ShimmerButton>
            <button
              onClick={() => {
                document.getElementById("below-fold")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden sm:flex items-center gap-1.5 px-6 py-3.5 min-h-[52px] text-sm font-body font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Explore the map
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>

          {/* Scroll indicator — hidden on mobile, static when reduced motion preferred */}
          {prefersReducedMotion ? (
            <div className="hidden md:flex justify-center">
              <svg className="w-5 h-5 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          ) : (
            <motion.div
              className="hidden md:flex justify-center"
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <svg className="w-5 h-5 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BELOW-FOLD SECTIONS
          ═══════════════════════════════════════════════════════════════ */}
      <div id="below-fold">
        {/* Credibility ticker bar */}
        <div className="bg-[#0A0D11] border-t border-b border-[var(--bg-elevated)] py-3 px-4">
          <p className="text-center text-xs tracking-widest uppercase font-body text-[var(--accent-primary)]/50">
            UC Berkeley Founded &middot; Congressional AI Policy Intern
          </p>
        </div>

        {/* How It Works — 3 cards */}
        <section className="py-16 md:py-24 px-4 max-w-4xl mx-auto">
          <RevealOnScroll>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] text-center mb-12">
              How PRISM works
            </h2>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Communities share perspectives",
                description: "Real people from real neighborhoods share how they experience the events shaping America.",
              },
              {
                step: "02",
                title: "See through different eyes",
                description: "Explore how the same event looks completely different from Chicago\u2019s South Side vs. Rural Montana vs. Little Havana.",
              },
              {
                step: "03",
                title: "Add your voice",
                description: "Your community has a perspective too. Share it and connect with neighborhoods you\u2019d never otherwise hear from.",
              },
            ].map((card, i) => (
              <RevealOnScroll
                key={card.step}
                className="bg-[var(--bg-surface)] border border-[var(--bg-elevated)] rounded-xl p-6"
                delay={i * 0.1}
              >
                <span className="font-mono text-xs text-[var(--accent-primary)] font-medium">{card.step}</span>
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mt-2 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] font-body leading-relaxed">
                  {card.description}
                </p>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* AHA Moment — Active Topic Preview */}
        {activeTopic && (
          <section className="py-12 md:py-20 px-4 max-w-lg mx-auto">
            <RevealOnScroll>
              <AnimatePresence mode="wait">
                {step === "map" && (
                  <motion.button
                    key="topic-card"
                    onClick={handleTopicTap}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="w-full text-left bg-[var(--bg-surface)] backdrop-blur-md rounded-xl border border-[var(--bg-elevated)] p-5 shadow-xl shadow-black/20 hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-live)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-live)]" />
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--accent-live)] uppercase tracking-wider">
                        Active Now
                      </span>
                    </div>
                    <p className="text-base font-display font-bold text-[var(--text-primary)] mb-1">
                      {activeTopic.title}
                    </p>
                    <p className="text-sm text-[var(--accent-primary)]">
                      Tap to see how communities are experiencing this &rarr;
                    </p>
                  </motion.button>
                )}

                {step === "topic" && (
                  <motion.div
                    key="loading-step"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-12"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-24 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent-primary)] rounded-full animate-shimmer" style={{ width: "80%" }} />
                      </div>
                      <span className="text-xs text-[var(--text-dim)] font-body">Loading perspectives...</span>
                    </div>
                  </motion.div>
                )}

                {step === "perspectives" && (
                  <motion.div
                    key="perspectives-step"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    {perspectives.length >= 2 && activeTopic ? (
                      <PerspectiveComparison
                        topicTitle={activeTopic.title}
                        perspectives={perspectives}
                        onSelectPerspective={() => setStep("signup")}
                      />
                    ) : (
                      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-elevated)] p-6 text-center">
                        <h2 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                          {activeTopic ? `Be the first voice on "${activeTopic.title}"` : "This conversation is just getting started."}
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] font-body mb-4">
                          No perspectives yet. Your community&apos;s take could be the one that starts the conversation.
                        </p>
                        <button
                          onClick={() => setStep("signup")}
                          className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-body font-medium hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 transition-all"
                        >
                          Share your perspective
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === "signup" && (
                  <motion.div
                    key="signup-step"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-elevated)] p-6 text-center shadow-xl"
                  >
                    <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">
                      Your perspective matters.
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] font-body mb-5">
                      Join PRISM and share how your community experiences the world.
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => router.push("/signup")}
                        className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-body font-medium hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 transition-all"
                      >
                        Create an account
                      </button>
                      <button
                        onClick={() => router.push("/feed")}
                        className="w-full py-2.5 rounded-xl text-sm font-body text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Continue browsing
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </RevealOnScroll>
          </section>
        )}

        {/* Early Access Email Capture */}
        <section className="py-16 md:py-24 px-4 bg-[#0D1117]/50">
          <RevealOnScroll className="max-w-lg mx-auto text-center">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] mb-3">
              Be one of the first voices on PRISM
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-body mb-8 max-w-md mx-auto leading-relaxed">
              Early access members shape how the platform grows. No spam, just an invite when your community is ready.
            </p>
            <EarlyAccessForm />
          </RevealOnScroll>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 px-4 text-center">
          <RevealOnScroll className="max-w-md mx-auto">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] mb-3">
              Every neighborhood has a story.
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-body mb-6">
              PRISM makes sure those stories don&apos;t stay invisible.
            </p>
            <ShimmerButton
              size="lg"
              onClick={() => router.push("/signup")}
            >
              Share your perspective
            </ShimmerButton>
          </RevealOnScroll>
        </section>
      </div>
    </div>
  );
}
