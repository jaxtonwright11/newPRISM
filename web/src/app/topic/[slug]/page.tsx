"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PerspectiveCard } from "@/components/perspective-card";
import { PerspectiveDetail } from "@/components/perspective-detail";
import { AlignmentPanel } from "@/components/alignment-panel";
import { MobileNav } from "@/components/mobile-nav";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { Topic, Community, CommunityAlignment, CommunityType, TopicStatus } from "@shared/types";

const STATUS_BADGE: Record<TopicStatus, { label: string; color: string }> = {
  hot: {
    label: "LIVE",
    color: "bg-prism-accent-live/15 text-prism-accent-live",
  },
  trending: {
    label: "DISCUSSED",
    color: "bg-prism-accent-active/15 text-prism-accent-active",
  },
  active: {
    label: "ACTIVE",
    color: "bg-prism-accent-verified/15 text-prism-accent-verified",
  },
  cooling: {
    label: "QUIETING",
    color: "bg-prism-text-dim/15 text-prism-text-dim",
  },
  archived: {
    label: "ARCHIVED",
    color: "bg-prism-text-dim/20 text-prism-text-dim",
  },
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

  const [topic, setTopic] = useState<Topic | null>(null);
  const [perspectives, setPerspectives] = useState<TopicPerspective[]>([]);
  const [alignments, setAlignments] = useState<CommunityAlignment[]>([]);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);

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
        setAlignments(data.alignments ?? []);
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
      <div className="min-h-screen bg-prism-bg-primary p-6">
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
      <div className="min-h-screen bg-prism-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-body font-bold text-prism-text-primary mb-2">
            Topic Not Found
          </h1>
          <p className="text-sm text-prism-text-dim mb-4">
            This topic doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/"
            className="text-sm text-prism-accent-active hover:underline"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[topic.status];

  return (
    <div className="flex h-screen overflow-hidden bg-prism-bg-primary">
      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topic header */}
        <header className="p-4 md:p-6 border-b border-prism-border bg-prism-bg-secondary">
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
            {badge && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.color}`}
              >
                {badge.label}
              </span>
            )}
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
                  onSelect={setSelectedPerspectiveId}
                  animationDelay={i * 50}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-prism-text-dim">
                No perspectives for this topic yet.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Alignment panel */}
      <AlignmentPanel alignments={alignments} topicTitle={topic.title} communities={allCommunities} />

      {/* Mobile bottom nav */}
      <MobileNav />

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
