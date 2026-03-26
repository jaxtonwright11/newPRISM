"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PerspectiveCard } from "@/components/perspective-card";
import { PerspectiveDetail } from "@/components/perspective-detail";
import { COMMUNITY_COLORS } from "@/lib/constants";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";
import type { Community, CommunityType, Topic } from "@shared/types";

interface CommunityPerspective {
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

export default function CommunityPage() {
  const params = useParams();
  const id = params.id as string;
  const { session } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [communityPerspectives, setCommunityPerspectives] = useState<CommunityPerspective[]>([]);
  const [activeTopics, setActiveTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);

  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommunity() {
      try {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        const res = await fetch(`/api/communities/${id}`, { headers });
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCommunity(data.community ?? null);
        setCommunityPerspectives(data.perspectives ?? []);
        setActiveTopics(data.topics ?? []);
        if (!data.community) setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchCommunity();
  }, [id, session?.access_token]);

  // Check if user follows this community
  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/communities/follow", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.follows?.includes(id)) setFollowing(true);
      })
      .catch(() => {});
  }, [id, session?.access_token]);

  const toggleFollow = async () => {
    if (!session?.access_token) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    try {
      const res = await fetch("/api/communities/follow", {
        method: wasFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ community_id: id }),
      });
      if (!res.ok) setFollowing(wasFollowing);
    } catch {
      setFollowing(wasFollowing);
    }
  };

  const selectedPerspective = selectedPerspectiveId
    ? communityPerspectives.find((p) => p.id === selectedPerspectiveId)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-base p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-prism-bg-elevated animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-prism-bg-elevated rounded-full w-1/3 animate-shimmer" />
              <div className="h-3 bg-prism-bg-elevated rounded-full w-1/4 animate-shimmer" />
            </div>
          </div>
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-prism-bg-elevated rounded-xl animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !community) {
    return (
      <div className="min-h-screen bg-prism-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-prism-text-dim text-sm">Community not found</p>
          <Link href="/" className="text-prism-accent-primary text-sm hover:underline mt-2 block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const color = COMMUNITY_COLORS[community.community_type as CommunityType];

  return (
    <div className="min-h-screen bg-prism-bg-base">
      <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-prism-text-primary truncate">{community.name}</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Community header card */}
        <div
          className="bg-prism-bg-surface rounded-2xl border border-prism-border p-6 mb-6"
          style={{ borderLeftWidth: "4px", borderLeftColor: color }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{ backgroundColor: color + "20", color }}
            >
              {community.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-prism-text-primary">{community.name}</h2>
                {community.verified && (
                  <svg className="w-4 h-4 text-prism-accent-live shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-prism-text-secondary">{community.region}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="inline-block text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: color + "15", color }}
                >
                  {community.community_type}
                </span>
                {session && (
                  <button
                    onClick={toggleFollow}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium transition-all ${
                      following
                        ? "bg-prism-accent-primary/15 text-prism-accent-primary border border-prism-accent-primary/30"
                        : "bg-prism-bg-elevated text-prism-text-secondary border border-prism-border hover:border-prism-accent-primary/30 hover:text-prism-accent-primary"
                    }`}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          </div>
          {community.description && (
            <p className="text-sm text-prism-text-secondary leading-relaxed mt-4">
              {community.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-prism-border">
            <div>
              <span className="font-mono text-lg font-bold text-prism-text-primary">{communityPerspectives.length}</span>
              <p className="text-[10px] text-prism-text-dim">Perspectives</p>
            </div>
            <div>
              <span className="font-mono text-lg font-bold text-prism-text-primary">{activeTopics.length}</span>
              <p className="text-[10px] text-prism-text-dim">Active Topics</p>
            </div>
          </div>
        </div>

        {/* Active topics */}
        {activeTopics.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-prism-text-dim uppercase tracking-wider mb-2 px-1">
              Active Topics
            </h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {activeTopics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topic/${topic.slug}`}
                  className="bg-prism-bg-surface rounded-lg border border-prism-border px-3 py-2 hover:bg-prism-bg-elevated transition-colors shrink-0"
                >
                  <span className="text-sm text-prism-text-primary whitespace-nowrap">{topic.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Perspectives */}
        <div>
          <h3 className="text-xs font-semibold text-prism-text-dim uppercase tracking-wider mb-3 px-1">
            Perspectives from {community.name}
          </h3>
          <div className="space-y-3">
            {communityPerspectives.length > 0 ? (
              communityPerspectives.map((p, i) => (
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
              ))
            ) : (
              <EmptyState {...EMPTY_STATES.communityPerspectives} />
            )}
          </div>
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
          created_at={selectedPerspective.created_at}
          onClose={() => setSelectedPerspectiveId(null)}
        />
      )}
    </div>
  );
}
