"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { PerspectiveCard } from "@/components/perspective-card";
import { FeedSkeleton } from "@/components/skeleton";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/use-realtime";
import type { Topic, CommunityType } from "@shared/types";

const PerspectiveDetail = dynamic(
  () => import("@/components/perspective-detail").then((mod) => mod.PerspectiveDetail),
  { ssr: false }
);

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

export default function DiscoverPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState("");
  const [perspectives, setPerspectives] = useState<DisplayPerspective[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { session } = useAuth();

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        const t: Topic[] = data.topics ?? [];
        setTopics(t);
        if (t.length > 0) setSelectedTopicSlug(t[0].slug);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTopicSlug) return;
    setLoading(true);
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    fetch(`/api/feed/discover?topic=${selectedTopicSlug}`, { headers })
      .then((res) => res.json())
      .then((json) => setPerspectives(json.data ?? []))
      .catch(() => setPerspectives([]))
      .finally(() => setLoading(false));
  }, [selectedTopicSlug, session?.access_token]);

  useRealtime({
    table: "perspectives",
    event: "INSERT",
    onInsert: useCallback((payload: Record<string, unknown>) => {
      if (payload.quote && payload.id) {
        setPerspectives((prev) => {
          if (prev.some((p) => p.id === payload.id)) return prev;
          return [payload as unknown as DisplayPerspective, ...prev];
        });
      }
    }, []),
    enabled: !!session,
  });

  const selectedPerspective = selectedPerspectiveId
    ? perspectives.find((p) => p.id === selectedPerspectiveId)
    : null;

  const filteredTopics = searchQuery
    ? topics.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : topics;

  return (
    <div className="flex flex-col h-full">
      {/* Search header */}
      <header className="px-4 pt-4 pb-2">
        <h1 className="font-display font-bold text-xl text-[var(--text-primary)] mb-3">Discover</h1>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] text-sm font-body text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
          />
        </div>
      </header>

      {/* Topic pills */}
      <div className="overflow-x-auto scrollbar-hide border-b border-[var(--bg-elevated)]">
        <div className="flex gap-2 px-4 py-2.5">
          {filteredTopics.filter((t) => t.status !== "archived").map((topic) => (
            <button
              key={topic.slug}
              onClick={() => setSelectedTopicSlug(topic.slug)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium font-body transition-all border ${
                selectedTopicSlug === topic.slug
                  ? "bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]"
                  : "bg-[var(--bg-elevated)] border-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {topic.title}
              {topic.status === "hot" && <span className="ml-1 text-[var(--accent-destructive)]">HOT</span>}
              {topic.status === "trending" && <span className="ml-1 text-[var(--accent-primary)]">TRENDING</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Perspectives */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {loading ? (
          <FeedSkeleton count={4} />
        ) : perspectives.length > 0 ? (
          <div className="flex flex-col gap-2 animate-fade-in">
            {perspectives.map((p, i) => (
              <PerspectiveCard
                key={p.id}
                id={p.id}
                community={p.community}
                quote={p.quote}
                context={p.context}
                category_tag={p.category_tag}
                reaction_count={p.reaction_count}
                bookmark_count={p.bookmark_count}
                isNew
                onSelect={setSelectedPerspectiveId}
                animationDelay={i * 50}
              />
            ))}
          </div>
        ) : (
          <EmptyState {...EMPTY_STATES.discover} />
        )}
      </div>

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
