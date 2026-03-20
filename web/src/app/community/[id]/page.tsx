"use client";

import { useState, use } from "react";
import Link from "next/link";
import { PerspectiveCard } from "@/components/perspective-card";
import { PerspectiveDetail } from "@/components/perspective-detail";
import { SEED_COMMUNITIES, SEED_PERSPECTIVES, SEED_TOPICS } from "@/lib/seed-data";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

interface CommunityPageProps {
  params: Promise<{ id: string }>;
}

export default function CommunityPage({ params }: CommunityPageProps) {
  const { id } = use(params);
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);

  const community = SEED_COMMUNITIES.find((c) => c.id === id);

  if (!community) {
    return (
      <div className="min-h-screen bg-prism-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-prism-text-dim text-sm">Community not found</p>
          <Link href="/" className="text-prism-accent-active text-sm hover:underline mt-2 block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const communityPerspectives = SEED_PERSPECTIVES.filter(
    (p) => p.community_id === community.id
  );

  const topicSlugs = [...new Set(communityPerspectives.map((p) => p.topic_slug))];
  const activeTopics = SEED_TOPICS.filter((t) => topicSlugs.includes(t.slug));

  const color = COMMUNITY_COLORS[community.community_type as CommunityType];

  const selectedPerspective = selectedPerspectiveId
    ? SEED_PERSPECTIVES.find((p) => p.id === selectedPerspectiveId)
    : null;

  return (
    <div className="min-h-screen bg-prism-bg-primary">
      <header className="border-b border-prism-border bg-prism-bg-secondary/95 backdrop-blur-md sticky top-0 z-30">
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
          className="bg-prism-bg-secondary rounded-2xl border border-prism-border p-6 mb-6"
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
                  <svg className="w-4 h-4 text-prism-accent-verified shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-prism-text-secondary">{community.region}</p>
              <span
                className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-2 capitalize"
                style={{ backgroundColor: color + "15", color }}
              >
                {community.community_type}
              </span>
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
                  className="bg-prism-bg-secondary rounded-lg border border-prism-border px-3 py-2 hover:bg-prism-bg-elevated transition-colors shrink-0"
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
              <div className="text-center py-12">
                <p className="text-sm text-prism-text-dim">No perspectives shared yet.</p>
              </div>
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
