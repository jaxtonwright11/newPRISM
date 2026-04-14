"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PerspectiveCard } from "@/components/perspective-card";
import { PerspectiveComparison } from "@/components/perspective-comparison";
import { FeedSkeleton } from "@/components/skeleton";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";
import { COMMUNITY_COLORS } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";
import { useRealtime } from "@/lib/use-realtime";
import { prismEvents } from "@/lib/posthog";
import type { Topic, Community, CommunityType, DisplayPerspective } from "@shared/types";
import { ActivityBar } from "@/components/activity-bar";

const PerspectiveDetail = dynamic(
  () => import("@/components/perspective-detail").then((mod) => mod.PerspectiveDetail),
  { ssr: false }
);

export default function DiscoverPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState("");
  const [perspectives, setPerspectives] = useState<DisplayPerspective[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);

  // Track discover feed opened
  useEffect(() => { prismEvents.discoverFeedOpened(); }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingCommunities, setTrendingCommunities] = useState<Community[]>([]);
  const { session } = useAuth();
  const { toast } = useToast();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        const t: Topic[] = data.topics ?? [];
        setTopics(t);
        if (t.length > 0) {
          setSelectedTopicSlug(t[0].slug);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => setTrendingCommunities((data.communities ?? []).slice(0, 8)))
      .catch(() => {});
  }, []);

  // Load user's followed communities
  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/communities/follow", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.follows) setFollowedIds(new Set(data.follows));
      })
      .catch(() => {});
  }, [session?.access_token]);

  const toggleFollow = async (communityId: string) => {
    if (!session?.access_token) return;
    const wasFollowing = followedIds.has(communityId);
    const community = trendingCommunities.find((c) => c.id === communityId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (wasFollowing) next.delete(communityId);
      else next.add(communityId);
      return next;
    });
    toast(wasFollowing ? `Unfollowed ${community?.name ?? "community"}` : `Following ${community?.name ?? "community"}`);
    try {
      const res = await fetch("/api/communities/follow", {
        method: wasFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ community_id: communityId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.add(communityId);
        else next.delete(communityId);
        return next;
      });
    }
  };

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

  const selectedTopicTitle = topics.find((t) => t.slug === selectedTopicSlug)?.title ?? "";

  // Show comparison view when we have perspectives from 2+ unique communities
  const uniqueCommunities = new Set(perspectives.map((p) => p.community.name));
  const showComparison = perspectives.length >= 2 && uniqueCommunities.size >= 2;

  return (
    <div className="flex flex-col h-full">
      <ActivityBar />
      {/* Search header */}
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display font-bold text-xl text-[var(--text-primary)]">Discover</h1>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search topics..."
            aria-label="Search topics"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] text-sm font-body text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
          />
        </div>
      </header>

      {/* Topic pills */}
      <div className="overflow-x-auto scrollbar-hide border-b border-[var(--bg-elevated)]" role="tablist" aria-label="Topics">
        <div className="flex gap-2 px-4 py-2.5">
          {filteredTopics.filter((t) => t.status !== "archived").map((topic) => (
            <button
              key={topic.slug}
              onClick={() => setSelectedTopicSlug(topic.slug)}
              role="tab"
              aria-selected={selectedTopicSlug === topic.slug}
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

      {/* Trending communities */}
      {trendingCommunities.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--bg-elevated)]">
          <p className="text-[10px] font-semibold text-prism-text-dim uppercase tracking-wider mb-2">
            Explore communities
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {trendingCommunities.map((c) => {
              const color = COMMUNITY_COLORS[c.community_type as CommunityType];
              const isFollowed = followedIds.has(c.id);
              return (
                <div
                  key={c.id}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                    isFollowed
                      ? "bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20"
                      : "bg-[var(--bg-surface)] border-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <Link href={`/community/${c.id}`} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <span className="text-xs text-prism-text-primary whitespace-nowrap">{c.name}</span>
                  </Link>
                  {session && (
                    <button
                      onClick={() => toggleFollow(c.id)}
                      aria-label={isFollowed ? `Unfollow ${c.name}` : `Follow ${c.name}`}
                      aria-pressed={isFollowed}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-all ${
                        isFollowed
                          ? "text-[var(--accent-primary)]"
                          : "text-[var(--text-dim)] hover:text-[var(--accent-primary)]"
                      }`}
                    >
                      {isFollowed ? "✓" : "+"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Perspectives */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="max-w-2xl mx-auto">
        {loading ? (
          <FeedSkeleton count={4} />
        ) : perspectives.length > 0 ? (
          <div className="flex flex-col gap-3 animate-fade-in" role="feed" aria-label="Discover perspectives">
            {showComparison && (
              <PerspectiveComparison
                topicTitle={selectedTopicTitle}
                perspectives={perspectives}
                onSelectPerspective={setSelectedPerspectiveId}
              />
            )}
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
                created_at={p.created_at}
                onSelect={setSelectedPerspectiveId}
                animationDelay={i * 50}
              />
            ))}
          </div>
        ) : (
          <EmptyState {...EMPTY_STATES.discover} />
        )}
        </div>
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
