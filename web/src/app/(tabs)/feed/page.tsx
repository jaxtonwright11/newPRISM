"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { PerspectiveCard } from "@/components/perspective-card";
import { FeedSkeleton } from "@/components/skeleton";
import { PrismWordmark } from "@/components/prism-wordmark";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";
import { COMMUNITY_COLORS } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/use-realtime";
import { useUnreadCount } from "@/lib/use-unread-count";
import { usePullToRefresh } from "@/lib/use-pull-to-refresh";
import { CommunityPulse } from "@/components/community-pulse";
import type { Community, CommunityType, Topic } from "@shared/types";
import Link from "next/link";

const MapPlaceholder = dynamic(
  () => import("@/components/map-placeholder").then((mod) => mod.MapPlaceholder),
  { ssr: false }
);

const PerspectiveDetail = dynamic(
  () => import("@/components/perspective-detail").then((mod) => mod.PerspectiveDetail),
  { ssr: false }
);

type FeedTab = "for-you" | "following" | "nearby";

interface DisplayPerspective {
  id: string;
  quote: string;
  context: string | null;
  category_tag: string | null;
  reaction_count: number;
  bookmark_count: number;
  created_at?: string;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [feedPerspectives, setFeedPerspectives] = useState<DisplayPerspective[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<Topic[]>([]);
  const [newPerspectiveCount, setNewPerspectiveCount] = useState(0);
  const [bufferedPerspectives, setBufferedPerspectives] = useState<DisplayPerspective[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { session } = useAuth();
  const unreadCount = useUnreadCount();
  const fetchFeedRef = useRef<() => Promise<void>>();

  const { ref: pullRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      if (fetchFeedRef.current) await fetchFeedRef.current();
    },
  });

  const [activeNowTopic, setActiveNowTopic] = useState<Topic | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [pulseOpen, setPulseOpen] = useState(false);

  // Welcome-back message for returning users
  useEffect(() => {
    const lastVisit = localStorage.getItem("prism_last_feed_visit");
    if (lastVisit) {
      const diff = Date.now() - new Date(lastVisit).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours >= 4 && hours < 24) {
        setWelcomeBack("New perspectives have been shared since you were last here.");
      } else if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setWelcomeBack(`${days} day${days > 1 ? "s" : ""} of new perspectives waiting for you.`);
      }
    }
    localStorage.setItem("prism_last_feed_visit", new Date().toISOString());
  }, []);

  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => setCommunities(data.communities ?? data ?? []))
      .catch(() => {});
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        const all: Topic[] = data.topics ?? [];
        const hot = all.find((t) => t.status === "hot");
        const trending = all.find((t) => t.status === "trending");
        setActiveNowTopic(hot ?? trending ?? null);
        const active = all.filter(
          (t) => t.status === "hot" || t.status === "trending" || t.status === "active"
        );
        setTrendingTopics(active.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchFeed() {
      setFeedLoading(true);
      setHasMore(true);
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      try {
        const endpoint = activeTab === "for-you"
          ? "/api/feed/for-you"
          : activeTab === "following"
            ? "/api/feed/communities"
            : "/api/feed/nearby";
        const res = await fetch(endpoint, { headers });
        const json = await res.json();
        const perspectives = activeTab === "nearby"
          ? (json.data?.perspectives ?? json.data ?? [])
          : (json.data ?? []);
        setFeedPerspectives(perspectives);
        if (perspectives.length < 30) setHasMore(false);
      } catch {
        setFeedPerspectives([]);
      } finally {
        setFeedLoading(false);
      }
    }
    fetchFeedRef.current = fetchFeed;
    fetchFeed();
  }, [activeTab, session?.access_token]);

  useRealtime({
    table: "perspectives",
    event: "INSERT",
    onInsert: useCallback((payload: Record<string, unknown>) => {
      if (payload.quote && payload.id) {
        setBufferedPerspectives((prev) => {
          if (prev.some((p) => p.id === payload.id)) return prev;
          return [payload as unknown as DisplayPerspective, ...prev];
        });
        setNewPerspectiveCount((c) => c + 1);
      }
    }, []),
    enabled: !!session,
  });

  // Infinite scroll: load more when sentinel is visible
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !feedLoading && hasMore) {
          setLoadingMore(true);
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }
          const endpoint = activeTab === "for-you"
            ? `/api/feed/for-you?offset=${feedPerspectives.length}`
            : activeTab === "following"
              ? "/api/feed/communities"
              : "/api/feed/nearby";
          fetch(endpoint, { headers })
            .then((res) => res.json())
            .then((json) => {
              const more = json.data ?? [];
              if (more.length === 0) {
                setHasMore(false);
              } else {
                setFeedPerspectives((prev) => {
                  const ids = new Set(prev.map((p) => p.id));
                  const unique = more.filter((p: DisplayPerspective) => !ids.has(p.id));
                  return [...prev, ...unique];
                });
                if (more.length < 30) setHasMore(false);
              }
            })
            .catch(() => setHasMore(false))
            .finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, feedLoading, feedPerspectives.length, activeTab, session?.access_token]);

  const showNewPerspectives = () => {
    setFeedPerspectives((prev) => [...bufferedPerspectives, ...prev]);
    setBufferedPerspectives([]);
    setNewPerspectiveCount(0);
  };

  const selectedPerspective = selectedPerspectiveId
    ? feedPerspectives.find((p) => p.id === selectedPerspectiveId)
    : null;

  const tabs: { id: FeedTab; label: string }[] = [
    { id: "for-you", label: "For You" },
    { id: "following", label: "Following" },
    { id: "nearby", label: "Nearby" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--bg-elevated)] max-w-2xl mx-auto w-full md:px-6">
        <PrismWordmark size="sm" />
        <div className="flex items-center gap-2">
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-full p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium font-body transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setPulseOpen(true)}
          className="p-1.5 text-[var(--text-dim)] hover:text-prism-accent-primary transition-colors"
          aria-label="Community Pulse"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </button>
        <Link href="/search" className="p-1.5 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors" aria-label="Search">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </Link>
        <Link href="/notifications" className="relative p-1.5 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors" aria-label="Notifications">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-prism-accent-primary text-white text-[10px] font-mono font-bold px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        </div>
      </header>

      {/* Collapsible map preview */}
      <button
        onClick={() => setMapExpanded(!mapExpanded)}
        className="flex items-center justify-center py-1.5 bg-[var(--bg-surface)] border-b border-[var(--bg-elevated)] text-[10px] text-[var(--text-dim)] font-body hover:text-[var(--text-secondary)] transition-colors"
      >
        <svg
          className={`w-3 h-3 mr-1 transition-transform ${mapExpanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
        {mapExpanded ? "Hide map" : "Show map"}
      </button>
      <AnimatePresence>
        {mapExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "40vh", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-b border-[var(--bg-elevated)]"
          >
            <div className="h-full p-2">
              <MapPlaceholder communities={communities} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Now banner */}
      {activeNowTopic && (
        <Link
          href={`/topic/${activeNowTopic.slug}`}
          className="mx-3 mt-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-primary)]/15 hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-prism-accent-live opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-prism-accent-live" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-prism-accent-live uppercase tracking-wider">Active Now</span>
            </div>
            <p className="text-sm font-medium text-prism-text-primary truncate">{activeNowTopic.title}</p>
          </div>
          <span className="text-[10px] text-[var(--accent-primary)] shrink-0">
            {activeNowTopic.community_count} communities →
          </span>
        </Link>
      )}

      {/* Trending topics */}
      {trendingTopics.length > 0 && (
        <div className="px-4 py-2.5 border-b border-[var(--bg-elevated)] overflow-x-auto no-scrollbar">
          <div className="flex gap-2 max-w-2xl mx-auto">
            {trendingTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topic/${topic.slug}`}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-transparent hover:border-[var(--accent-primary)]/20 transition-all text-xs"
              >
                {(topic.status === "hot" || topic.status === "trending") && (
                  <span className={`w-1.5 h-1.5 rounded-full ${topic.status === "hot" ? "bg-prism-accent-primary" : "bg-prism-accent-primary/60"}`} />
                )}
                <span className="text-prism-text-primary whitespace-nowrap">{topic.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <div ref={pullRef} className="flex-1 overflow-y-auto p-3 md:p-6">
        {/* Pull-to-refresh indicator */}
        {pullDistance > 0 && (
          <div
            className="flex items-center justify-center transition-opacity"
            style={{ height: pullDistance, opacity: Math.min(pullDistance / 60, 1) }}
          >
            <div className={`w-5 h-5 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent ${isRefreshing ? "animate-spin" : ""}`} />
          </div>
        )}
        <div className="max-w-2xl mx-auto">
        {/* Welcome back message */}
        {welcomeBack && (
          <div className="mb-3 px-4 py-3 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 flex items-center justify-between">
            <p className="text-xs text-[var(--text-secondary)]">{welcomeBack}</p>
            <button onClick={() => setWelcomeBack(null)} className="text-[var(--text-dim)] hover:text-[var(--text-secondary)] ml-2 shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {/* New perspectives banner */}
        {newPerspectiveCount > 0 && (
          <button
            onClick={showNewPerspectives}
            className="w-full mb-3 py-2.5 rounded-xl bg-prism-accent-primary/10 border border-prism-accent-primary/20 text-sm text-prism-accent-primary font-medium hover:bg-prism-accent-primary/15 transition-colors"
          >
            {newPerspectiveCount} new perspective{newPerspectiveCount > 1 ? "s" : ""} — tap to see
          </button>
        )}
        {feedLoading ? (
          <FeedSkeleton count={4} />
        ) : feedPerspectives.length > 0 ? (
          <div className="flex flex-col gap-2 animate-fade-in">
            {feedPerspectives.map((p, i) => (
              <PerspectiveCard
                key={p.id}
                id={p.id}
                community={p.community}
                quote={p.quote}
                context={p.context}
                category_tag={p.category_tag}
                reaction_count={p.reaction_count}
                bookmark_count={p.bookmark_count}
                created_at={p.created_at}
                onSelect={setSelectedPerspectiveId}
                animationDelay={i * 50}
              />
            ))}
            {/* Infinite scroll sentinel */}
            {hasMore && activeTab === "for-you" && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {loadingMore && (
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
                )}
              </div>
            )}
            {/* End of feed CTA */}
            {!hasMore && feedPerspectives.length > 0 && (
              <div className="py-8 text-center">
                <p className="text-xs text-[var(--text-dim)] mb-3">You&apos;re all caught up</p>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/15 transition-colors"
                >
                  Explore more communities →
                </Link>
              </div>
            )}
          </div>
        ) : activeTab === "following" && communities.length > 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-1">No perspectives from your communities yet.</p>
            <p className="text-xs text-[var(--text-dim)] mb-5">Follow communities to see their perspectives here.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {communities.slice(0, 6).map((c) => {
                const color = COMMUNITY_COLORS[c.community_type as CommunityType];
                return (
                  <Link
                    key={c.id}
                    href={`/community/${c.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] hover:border-[var(--accent-primary)]/30 transition-colors"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <span className="text-xs text-prism-text-primary">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState {...(
            activeTab === "for-you" ? EMPTY_STATES.feedForYou
            : activeTab === "following" ? EMPTY_STATES.feedFollowing
            : EMPTY_STATES.feedNearby
          )} />
        )}
        </div>
      </div>

      {/* Perspective detail modal */}
      {selectedPerspective && (
        <PerspectiveDetail
          id={selectedPerspective.id}
          community={selectedPerspective.community}
          quote={selectedPerspective.quote}
          context={selectedPerspective.context}
          category_tag={selectedPerspective.category_tag}
          reaction_count={selectedPerspective.reaction_count}
          bookmark_count={selectedPerspective.bookmark_count}
          onClose={() => setSelectedPerspectiveId(null)}
        />
      )}

      {/* Community Pulse panel */}
      <CommunityPulse isOpen={pulseOpen} onClose={() => setPulseOpen(false)} />
    </div>
  );
}
