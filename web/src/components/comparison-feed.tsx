"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { COMMUNITY_COLORS } from "@/lib/constants";
import { prismEvents } from "@/lib/posthog";
import type { CommunityType } from "@shared/types";
import { FirstSessionCard } from "@/components/first-session-card";

interface Perspective {
  id: string;
  quote: string;
  context: string | null;
  reaction_count: number;
  bookmark_count: number;
  created_at?: string;
  community: {
    id: string;
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
  };
}

interface ComparisonGroup {
  topic: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };
  perspectives: Perspective[];
  has_comparison: boolean;
}

function ComparisonCard({ group, onComparisonViewed, onScrollToNext, hasNext }: { group: ComparisonGroup; onComparisonViewed?: (topicSlug: string, count: number) => void; onScrollToNext?: () => void; hasNext?: boolean }) {
  const { session } = useAuth();
  const [reacted, setReacted] = useState(false);
  const trackedRef = useRef(false);

  const shown = group.perspectives.slice(0, 4);
  const isComparison = shown.length >= 2;

  // Track when a comparison is viewed
  useEffect(() => {
    if (isComparison && !trackedRef.current) {
      trackedRef.current = true;
      prismEvents.activationComparisonViewed(group.topic.slug, shown.length);
      onComparisonViewed?.(group.topic.slug, shown.length);
    }
  }, [isComparison, group.topic.slug, shown.length, onComparisonViewed]);

  const handleReact = useCallback(async () => {
    if (reacted || !session?.access_token) return;
    setReacted(true);
    prismEvents.activationComparisonReacted(group.topic.slug);
    // React to all perspectives in this comparison
    for (const p of group.perspectives) {
      fetch(`/api/perspectives/${p.id}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reaction_type: "i_didnt_know_this" }),
      }).catch(() => {});
    }
  }, [reacted, session?.access_token, group.perspectives, group.topic.slug]);

  return (
    <motion.div
      className="rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Topic header */}
      <div className="px-4 py-3 border-b border-[var(--bg-elevated)]">
        <div className="flex items-center justify-between">
          <div>
            {isComparison && (
              <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--accent-primary)] font-medium">
                Same topic &middot; Different worlds
              </span>
            )}
            <h3 className="text-sm font-display font-bold text-[var(--text-primary)] mt-0.5">
              {group.topic.title}
            </h3>
          </div>
          {(group.topic.status === "hot" || group.topic.status === "trending") && (
            <span className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-live)] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent-live)]" />
              </span>
              <span className="text-[9px] font-semibold text-[var(--accent-live)] uppercase tracking-wider">
                {group.topic.status === "hot" ? "Hot" : "Trending"}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Perspectives */}
      <div className="divide-y divide-[var(--bg-elevated)]/50">
        {shown.map((p) => {
          const comm = Array.isArray(p.community) ? p.community[0] : p.community;
          const color = (comm as { color_hex: string })?.color_hex ?? COMMUNITY_COLORS[(comm as { community_type: CommunityType })?.community_type] ?? "#3B82F6";
          const name = (comm as { name: string })?.name ?? "Community";
          const region = (comm as { region: string })?.region ?? "";

          return (
            <Link
              key={p.id}
              href={`/perspective/${p.id}`}
              className="block px-4 py-3.5 relative hover:bg-[var(--bg-elevated)]/30 transition-colors group"
            >
              {/* Accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
                style={{ backgroundColor: color }}
              />

              <div className="pl-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }}
                  />
                  <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
                    {name}
                  </span>
                  {region && (
                    <span className="text-[10px] text-[var(--text-dim)]">{region}</span>
                  )}
                </div>
                <p className="text-[14px] leading-relaxed text-[var(--text-primary)] font-body">
                  &ldquo;{p.quote}&rdquo;
                </p>
                {p.context && (
                  <p className="text-[11px] text-[var(--text-dim)] mt-1 line-clamp-1">{p.context}</p>
                )}
              </div>

              {/* Hover arrow */}
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-dim)] opacity-0 group-hover:opacity-50 transition-opacity"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>

      {/* Footer: reaction + share + add voice */}
      <div className="px-4 py-2.5 border-t border-[var(--bg-elevated)]/50 flex items-center gap-2">
        {session && (
          <button
            onClick={handleReact}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${
              reacted
                ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span className="text-xs">💡</span>
            {reacted ? "Eye-opening" : "I never knew"}
          </button>
        )}

        <Link
          href={`/compare/${group.topic.slug}`}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
          </svg>
          Share
        </Link>

        {!isComparison && (
          <Link
            href="/create"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/15 transition-all ml-auto"
          >
            Add your voice
          </Link>
        )}

        {reacted && hasNext && onScrollToNext && (
          <button
            onClick={onScrollToNext}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all ml-auto"
          >
            Next comparison
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function ComparisonFeed() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<ComparisonGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const activationFiredRef = useRef(false);
  const comparisonTopicsViewedRef = useRef(new Set<string>());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // First-session detection and day-2 return tracking
  useEffect(() => {
    const FIRST_VISIT_KEY = "prism_first_visit_ts";
    const DAY2_FIRED_KEY = "prism_day2_fired";
    const now = Date.now();
    const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);

    if (!firstVisit) {
      localStorage.setItem(FIRST_VISIT_KEY, String(now));
      prismEvents.activationFirstSessionStart();
    } else {
      const elapsed = now - Number(firstVisit);
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (elapsed >= oneDayMs && !localStorage.getItem(DAY2_FIRED_KEY)) {
        localStorage.setItem(DAY2_FIRED_KEY, "1");
        prismEvents.returnDay2();
      }
    }
  }, []);

  // Callback when a comparison is viewed — fire activation event after 2+ topics
  const handleComparisonViewed = useCallback((topicSlug: string) => {
    comparisonTopicsViewedRef.current.add(topicSlug);
    if (comparisonTopicsViewedRef.current.size >= 2 && !activationFiredRef.current) {
      activationFiredRef.current = true;
      prismEvents.activationEventCompleted();
    }
  }, []);

  const scrollToCard = useCallback((index: number) => {
    const nextGroup = groups[index];
    if (!nextGroup) return;
    const el = cardRefs.current.get(nextGroup.topic.id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [groups]);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    fetch("/api/feed/comparisons", { headers })
      .then((r) => r.json())
      .then((json) => {
        setGroups(json.data ?? []);
        setHasMore(json.meta?.has_more ?? false);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading && hasMore) {
          setLoadingMore(true);
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }
          fetch(`/api/feed/comparisons?offset=${groups.length}`, { headers })
            .then((r) => r.json())
            .then((json) => {
              const more = json.data ?? [];
              if (more.length === 0) {
                setHasMore(false);
              } else {
                setGroups((prev) => [...prev, ...more]);
                setHasMore(json.meta?.has_more ?? false);
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
  }, [hasMore, loadingMore, loading, groups.length, session?.access_token]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--bg-elevated)]">
              <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded animate-pulse" />
              <div className="h-4 w-48 bg-[var(--bg-elevated)] rounded animate-pulse mt-2" />
            </div>
            <div className="px-4 py-3">
              <div className="h-3 w-full bg-[var(--bg-elevated)] rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-[var(--bg-elevated)] rounded animate-pulse mt-2" />
            </div>
            <div className="px-4 py-3 border-t border-[var(--bg-elevated)]">
              <div className="h-3 w-full bg-[var(--bg-elevated)] rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-[var(--bg-elevated)] rounded animate-pulse mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return <FirstSessionCard />;
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, i) => (
        <div key={group.topic.id} ref={(el) => { if (el) cardRefs.current.set(group.topic.id, el); }}>
          <ComparisonCard
            group={group}
            onComparisonViewed={handleComparisonViewed}
            hasNext={i < groups.length - 1}
            onScrollToNext={() => scrollToCard(i + 1)}
          />
        </div>
      ))}

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loadingMore && (
            <div className="w-5 h-5 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
          )}
        </div>
      )}

      {!hasMore && groups.length > 0 && (
        <div className="py-6 text-center">
          <p className="text-xs text-[var(--text-dim)] mb-3">You&apos;ve seen all active topics</p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/15 transition-colors"
          >
            Explore more communities &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
