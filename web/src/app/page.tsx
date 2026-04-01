"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { PrismWordmark } from "@/components/prism-wordmark";
import type { Community, Topic, CommunityType } from "@shared/types";

const MapPlaceholder = dynamic(
  () => import("@/components/map-placeholder").then((mod) => mod.MapPlaceholder),
  { ssr: false }
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
    <div id="main-content" className="min-h-screen bg-[var(--bg-base)] flex flex-col relative overflow-hidden">
      {/* Map — always visible as background */}
      <div className="absolute inset-0 z-0">
        <MapPlaceholder
          communities={communities}
          isAuthenticated={false}
          hideOverlays
        />
      </div>

      {/* Gradient overlay at bottom for readability */}
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/85 to-transparent z-10 pointer-events-none" />

      {/* Content overlay — pointer-events-none so map is interactive beneath */}
      <div className="relative z-20 flex flex-col min-h-screen pointer-events-none">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-4 pointer-events-auto">
          <PrismWordmark size="md" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2.5 text-sm font-body font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] flex items-center"
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-body font-medium hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 transition-all min-h-[44px] flex items-center"
            >
              Sign up
            </button>
          </div>
        </header>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* AHA sequence content */}
        <div className="px-4 pb-12 max-w-lg mx-auto w-full pointer-events-auto">
          <AnimatePresence mode="wait">
            {step === "map" && (
              <motion.div
                key="map-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Active Now topic card */}
                {activeTopic && (
                  <button
                    onClick={handleTopicTap}
                    className="w-full text-left bg-[var(--bg-surface)]/95 backdrop-blur-md rounded-xl border border-[var(--bg-elevated)] p-4 shadow-xl shadow-black/30 hover:bg-[var(--bg-elevated)]/95 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
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
                      Tap to see how communities are experiencing this →
                    </p>
                  </button>
                )}

                {!activeTopic && (
                  <div className="text-center py-8 space-y-4">
                    <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
                      See how communities experience the same events.
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] font-body">
                      Different neighborhoods. Same moment. Completely different worlds.
                    </p>
                    <button
                      onClick={() => router.push("/signup")}
                      className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-body font-medium hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 transition-all"
                    >
                      Join PRISM
                    </button>
                  </div>
                )}
              </motion.div>
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
                  <div className="bg-[var(--bg-surface)]/95 backdrop-blur-md rounded-xl border border-[var(--bg-elevated)] p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/15 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    </div>
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

                {/* Soft signup prompt */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="text-center"
                >
                  <button
                    onClick={() => setStep("signup")}
                    className="text-sm text-[var(--accent-primary)] font-body font-medium hover:underline"
                  >
                    Connect with these communities →
                  </button>
                </motion.div>
              </motion.div>
            )}

            {step === "signup" && (
              <motion.div
                key="signup-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-[var(--bg-surface)]/95 backdrop-blur-md rounded-xl border border-[var(--bg-elevated)] p-6 text-center shadow-xl"
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
        </div>
      </div>
    </div>
  );
}
