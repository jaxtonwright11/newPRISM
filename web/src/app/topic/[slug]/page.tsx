"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PerspectiveCard } from "@/components/perspective-card";
import { PerspectiveDetail } from "@/components/perspective-detail";
import { COMMUNITY_COLORS, REACTION_LABELS } from "@/lib/constants";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";
import { useToast } from "@/components/toast";
import type { Topic, Community, CommunityType, TopicStatus, ReactionType } from "@shared/types";
import type { CommunitySentiment } from "@/app/api/map/sentiment/route";

const STATUS_DOT: Record<TopicStatus, string> = {
  hot: "bg-prism-accent-primary",
  trending: "bg-prism-accent-primary/60",
  active: "bg-prism-accent-live/60",
  cooling: "bg-prism-text-dim/40",
  archived: "bg-prism-text-dim/20",
};

interface TopicPerspective {
  id: string;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
  quote: string;
  context: string | null;
  category_tag: string | null;
  reaction_count: number;
  bookmark_count: number;
  created_at?: string;
}

export default function TopicDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { session } = useAuth();
  const { toast } = useToast();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [perspectives, setPerspectives] = useState<TopicPerspective[]>([]);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);
  const [topicSaved, setTopicSaved] = useState(false);
  const [sentimentData, setSentimentData] = useState<CommunitySentiment[]>([]);

  useEffect(() => {
    async function fetchTopic() {
      try {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        const [topicRes, communitiesRes] = await Promise.all([
          fetch(`/api/topics/${slug}`, { headers }),
          fetch("/api/communities"),
        ]);
        if (!topicRes.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await topicRes.json();
        const commData = await communitiesRes.json();
        setTopic(data.topic ?? null);
        setPerspectives(data.perspectives ?? []);
        setAllCommunities(commData.communities ?? []);
        if (!data.topic) setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchTopic();
  }, [slug, session?.access_token]);

  // Fetch sentiment data for geographic summary
  useEffect(() => {
    if (!topic?.id) return;
    fetch(`/api/map/sentiment?topic_id=${topic.id}`)
      .then((res) => res.json())
      .then((data) => setSentimentData(data.sentiments ?? []))
      .catch(() => {});
  }, [topic?.id]);

  // Communities that have perspectives on this topic (for header display)
  const topicCommunities = useMemo(() => {
    const seen = new Set<string>();
    return perspectives.reduce<Community[]>((acc, p) => {
      const match = allCommunities.find((c) => c.name === p.community.name);
      if (match && !seen.has(match.id)) {
        seen.add(match.id);
        acc.push(match);
      }
      return acc;
    }, []);
  }, [perspectives, allCommunities]);

  const selectedPerspective = selectedPerspectiveId
    ? perspectives.find((p) => p.id === selectedPerspectiveId)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-base p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-6 bg-prism-bg-elevated rounded-full w-1/4 animate-shimmer" />
          <div className="h-8 bg-prism-bg-elevated rounded-full w-2/3 animate-shimmer" />
          <div className="h-4 bg-prism-bg-elevated rounded-full w-1/2 animate-shimmer" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-prism-bg-elevated rounded-xl animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !topic) {
    return (
      <div className="min-h-screen bg-prism-bg-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-body font-bold text-prism-text-primary mb-2">
            Topic Not Found
          </h1>
          <p className="text-sm text-prism-text-dim mb-4">
            This topic doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/"
            className="text-sm text-prism-accent-primary hover:underline"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    );
  }

  const dotColor = STATUS_DOT[topic.status];

  return (
    <div className="flex h-screen overflow-hidden bg-prism-bg-base">
      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topic header */}
        <header className="p-4 md:p-6 border-b border-prism-border bg-prism-bg-surface">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-prism-bg-elevated text-prism-text-dim hover:text-prism-text-primary transition-colors"
              aria-label="Back to home"
            >
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
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </Link>
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          </div>

          <h1 className="font-body text-xl md:text-2xl font-bold text-prism-text-primary mb-2">
            {topic.title}
          </h1>
          {topic.summary && (
            <p className="text-sm text-prism-text-secondary leading-relaxed max-w-2xl">
              {topic.summary}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-prism-text-dim font-mono">
              {topic.perspective_count} perspectives
            </span>
            <span className="text-xs text-prism-text-dim font-mono">
              {topic.community_count} communities
            </span>
            {session && (
              <button
                onClick={async () => {
                  if (!session.access_token) return;
                  const wasSaved = topicSaved;
                  setTopicSaved(!wasSaved);
                  toast(wasSaved ? "Topic unsaved" : "Topic saved");
                  try {
                    await fetch("/api/bookmarks/topics", {
                      method: wasSaved ? "DELETE" : "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({ topic_id: topic.id }),
                    });
                  } catch {
                    setTopicSaved(wasSaved);
                  }
                }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all ${
                  topicSaved
                    ? "bg-prism-accent-primary/15 text-prism-accent-primary"
                    : "text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated"
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={topicSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                {topicSaved ? "Saved" : "Save"}
              </button>
            )}
          </div>

          {/* Active communities */}
          {topicCommunities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {topicCommunities.map((community) => (
                <Link
                  key={community.id}
                  href={`/community/${community.id}`}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: COMMUNITY_COLORS[community.community_type] + "15",
                    color: COMMUNITY_COLORS[community.community_type],
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COMMUNITY_COLORS[community.community_type] }}
                  />
                  {community.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Geographic Summary — visual distribution of perspectives */}
        {sentimentData.length > 1 && (
          <div className="px-4 md:px-6 pt-4 pb-2">
            <div className="bg-prism-bg-elevated/50 rounded-xl border border-prism-border/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-3.5 h-3.5 text-prism-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <span className="text-[11px] font-semibold text-prism-text-secondary uppercase tracking-wider">
                  Geographic Distribution
                </span>
              </div>

              {/* Sentiment summary bars */}
              <div className="space-y-2">
                {(["this_resonates", "seeing_differently", "want_to_understand"] as ReactionType[]).map((reaction) => {
                  const count = sentimentData.filter((s) => s.dominant_reaction === reaction).length;
                  if (count === 0) return null;
                  const pct = Math.round((count / sentimentData.length) * 100);
                  const colors: Record<ReactionType, string> = {
                    this_resonates: "#4ADE80",
                    seeing_differently: "#F59E0B",
                    want_to_understand: "#3B82F6",
                  };
                  return (
                    <div key={reaction} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-40 flex-shrink-0">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[reaction] }} />
                        <span className="text-[10px] text-prism-text-secondary truncate">
                          {REACTION_LABELS[reaction].label}
                        </span>
                      </div>
                      <div className="flex-1 h-1.5 bg-prism-bg-base rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: colors[reaction] }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-prism-text-dim w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Region list */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {sentimentData.slice(0, 6).map((s) => {
                  const colors: Record<string, string> = {
                    this_resonates: "#4ADE80",
                    seeing_differently: "#F59E0B",
                    want_to_understand: "#3B82F6",
                  };
                  return (
                    <span
                      key={s.community_id}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: (colors[s.dominant_reaction] ?? "#9CA3AF") + "12",
                        color: colors[s.dominant_reaction] ?? "#9CA3AF",
                      }}
                    >
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors[s.dominant_reaction] }} />
                      {s.community_name}
                    </span>
                  );
                })}
                {sentimentData.length > 6 && (
                  <span className="text-[10px] text-prism-text-dim px-2 py-0.5">
                    +{sentimentData.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Perspectives */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {perspectives.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
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
            <EmptyState {...EMPTY_STATES.topicPerspectives} />
          )}
        </div>
      </main>

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
          created_at={selectedPerspective.created_at}
          onClose={() => setSelectedPerspectiveId(null)}
        />
      )}
    </div>
  );
}
