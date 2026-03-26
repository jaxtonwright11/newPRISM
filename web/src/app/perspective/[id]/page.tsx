"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { COMMUNITY_COLORS, REACTION_LABELS } from "@/lib/constants";
import { ShareButton } from "@/components/share-button";
import { ReportButton } from "@/components/report-button";
import { CommentThread } from "@/components/comment-thread";
import { useAuth } from "@/lib/auth-context";
import type { CommunityType, ReactionType } from "@shared/types";

interface PerspectiveData {
  id: string;
  quote: string;
  context: string | null;
  category_tag: string | null;
  reaction_count: number;
  bookmark_count: number;
  created_at: string;
  community: {
    id: string;
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
  topic: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export default function PerspectivePage() {
  const params = useParams();
  const id = params.id as string;
  const [perspective, setPerspective] = useState<PerspectiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
  const [reactionDelta, setReactionDelta] = useState(0);
  const { session } = useAuth();

  const handleReaction = useCallback(async (type: ReactionType) => {
    const wasActive = activeReaction === type;
    setActiveReaction(wasActive ? null : type);
    setReactionDelta(wasActive ? 0 : 1);

    if (!session?.access_token) return;
    try {
      await fetch(`/api/perspectives/${id}/react`, {
        method: wasActive ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reaction_type: type }),
      });
    } catch {
      setActiveReaction(wasActive ? type : null);
      setReactionDelta(wasActive ? 1 : 0);
    }
  }, [activeReaction, id, session?.access_token]);

  useEffect(() => {
    async function fetchPerspective() {
      try {
        const res = await fetch(`/api/perspectives/${id}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const json = await res.json();
        setPerspective(json.data ?? null);
        if (!json.data) setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPerspective();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-base p-6">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-prism-bg-elevated animate-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-prism-bg-elevated rounded-full w-1/3 animate-shimmer" />
              <div className="h-3 bg-prism-bg-elevated rounded-full w-1/4 animate-shimmer" />
            </div>
          </div>
          <div className="h-32 bg-prism-bg-elevated rounded-xl animate-shimmer" />
          <div className="h-16 bg-prism-bg-elevated rounded-xl animate-shimmer" />
        </div>
      </div>
    );
  }

  if (notFound || !perspective) {
    return (
      <div className="min-h-screen bg-prism-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-prism-text-dim text-sm">Perspective not found</p>
          <Link href="/" className="text-prism-accent-primary text-sm hover:underline mt-2 block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const { community, topic } = perspective;
  const color = community.color_hex || COMMUNITY_COLORS[community.community_type];
  const formattedDate = new Date(perspective.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-prism-bg-base">
      <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-prism-text-primary">Perspective</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div
          className="bg-prism-bg-surface rounded-2xl border border-prism-border p-6"
          style={{ borderLeftWidth: "4px", borderLeftColor: color }}
        >
          {/* Community header */}
          <div className="flex items-center gap-3 mb-5">
            <Link
              href={`/community/${community.id}`}
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: color + "20", color }}
            >
              {community.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/community/${community.id}`}
                  className="text-base font-medium text-prism-text-primary hover:underline"
                >
                  {community.name}
                </Link>
                {community.verified && (
                  <svg className="w-4 h-4 text-prism-accent-live" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-prism-text-dim">{community.region}</span>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="font-body text-xl leading-relaxed text-prism-text-primary mb-4">
            &ldquo;{perspective.quote}&rdquo;
          </blockquote>

          {/* Context */}
          {perspective.context && (
            <p className="text-sm text-prism-text-secondary leading-relaxed mb-5">
              {perspective.context}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {perspective.category_tag && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-prism-bg-elevated text-prism-text-dim">
                {perspective.category_tag}
              </span>
            )}
            <span
              className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1 capitalize"
              style={{
                backgroundColor: COMMUNITY_COLORS[community.community_type] + "15",
                color: COMMUNITY_COLORS[community.community_type],
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: COMMUNITY_COLORS[community.community_type] }}
              />
              {community.community_type}
            </span>
            {topic && (
              <Link
                href={`/topic/${topic.slug}`}
                className="text-xs px-2.5 py-1 rounded-full bg-prism-accent-primary/10 text-prism-accent-primary hover:bg-prism-accent-primary/20 transition-colors"
              >
                {topic.title}
              </Link>
            )}
            <span className="text-xs text-prism-text-dim">{formattedDate}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-prism-border mb-4" />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {(
                Object.entries(REACTION_LABELS) as [ReactionType, { emoji: string; label: string }][]
              ).map(([type, { emoji, label }]) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-all ${
                    activeReaction === type
                      ? "bg-prism-accent-primary/20 text-prism-accent-primary"
                      : "text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated"
                  }`}
                  title={label}
                >
                  <span>{emoji}</span>
                  <span className="font-mono text-xs">
                    {perspective.reaction_count + (activeReaction === type ? reactionDelta : 0)}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ShareButton perspectiveId={perspective.id} quote={perspective.quote} />
              <ReportButton contentType="perspective" contentId={perspective.id} />
            </div>
          </div>

          {/* Comments */}
          <CommentThread perspectiveId={perspective.id} />
        </div>

        {/* Signup CTA for unauthenticated users */}
        {!session && (
          <div className="mt-4 p-4 rounded-xl bg-prism-bg-surface border border-prism-border text-center">
            <p className="text-sm text-prism-text-secondary mb-3">
              See how communities across the world experience the same events differently.
            </p>
            <Link
              href="/signup"
              className="inline-block px-6 py-2.5 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-glow transition-colors"
            >
              Join PRISM
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
