"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { PerspectiveCard } from "@/components/perspective-card";
import { FeedSkeleton } from "@/components/skeleton";
import { PrismWordmark } from "@/components/prism-wordmark";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/use-realtime";
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
  const { session } = useAuth();

  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => setCommunities(data.communities ?? data ?? []))
      .catch(() => {});
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        const active = (data.topics ?? []).filter(
          (t: Topic) => t.status === "hot" || t.status === "trending" || t.status === "active"
        );
        setTrendingTopics(active.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchFeed() {
      setFeedLoading(true);
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
      } catch {
        setFeedPerspectives([]);
      } finally {
        setFeedLoading(false);
      }
    }
    fetchFeed();
  }, [activeTab, session?.access_token]);

  useRealtime({
    table: "perspectives",
    event: "INSERT",
    onInsert: useCallback((payload: Record<string, unknown>) => {
      if (payload.quote && payload.id) {
        setFeedPerspectives((prev) => {
          if (prev.some((p) => p.id === payload.id)) return prev;
          return [payload as unknown as DisplayPerspective, ...prev];
        });
      }
    }, []),
    enabled: !!session,
  });

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
        <Link href="/search" className="p-1.5 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors" aria-label="Search">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </Link>
        <Link href="/notifications" className="p-1.5 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors" aria-label="Notifications">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
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
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="max-w-2xl mx-auto">
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
                isNew={false}
                onSelect={setSelectedPerspectiveId}
                animationDelay={i * 50}
              />
            ))}
          </div>
        ) : (
          <EmptyState {...EMPTY_STATES.feed} />
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
    </div>
  );
}
