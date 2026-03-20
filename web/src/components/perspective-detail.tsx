"use client";

import { useState } from "react";
import type { CommunityType, ReactionType } from "@shared/types";
import { REACTION_LABELS, COMMUNITY_COLORS } from "@/lib/constants";
import { ConnectModal } from "@/components/connect-modal";

interface PerspectiveDetailProps {
  id: string;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
  quote: string;
  context: string;
  category_tag: string;
  reaction_count: number;
  bookmark_count: number;
  created_at: string;
  topicTitle?: string;
  onClose: () => void;
}

export function PerspectiveDetail({
  community,
  quote,
  context,
  category_tag,
  reaction_count,
  bookmark_count,
  created_at,
  topicTitle,
  onClose,
}: PerspectiveDetailProps) {
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  const handleReaction = (type: ReactionType) => {
    setActiveReaction(activeReaction === type ? null : type);
  };

  const formattedDate = new Date(created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
    {showConnect && (
      <ConnectModal
        community={community}
        topicTitle={topicTitle ?? "this topic"}
        onClose={() => setShowConnect(false)}
      />
    )}
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-prism-bg-secondary border border-prism-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in"
        style={{ borderLeftWidth: "4px", borderLeftColor: community.color_hex }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-prism-bg-elevated text-prism-text-dim hover:text-prism-text-primary transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Community header */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: community.color_hex + "20",
                color: community.color_hex,
              }}
            >
              {community.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-medium text-prism-text-primary">
                  {community.name}
                </span>
                {community.verified && (
                  <svg className="w-4 h-4 text-prism-accent-verified" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-prism-text-dim">{community.region}</span>
            </div>
          </div>

          {/* Quote — large, prominent */}
          <blockquote className="font-display italic text-xl leading-relaxed text-prism-text-primary mb-4 border-l-0">
            &ldquo;{quote}&rdquo;
          </blockquote>

          {/* Context */}
          <p className="text-sm text-prism-text-secondary leading-relaxed mb-6">
            {context}
          </p>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs px-2.5 py-1 rounded-full bg-prism-bg-elevated text-prism-text-dim">
              {category_tag}
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1"
              style={{
                backgroundColor: COMMUNITY_COLORS[community.community_type] + "15",
                color: COMMUNITY_COLORS[community.community_type],
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: COMMUNITY_COLORS[community.community_type],
                }}
              />
              {community.community_type}
            </span>
            <span className="text-xs text-prism-text-dim">{formattedDate}</span>
          </div>

          {/* Connect CTA */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowConnect(true); }}
            className="w-full py-2.5 rounded-xl border border-prism-border text-sm font-medium text-prism-text-secondary hover:text-prism-text-primary hover:border-prism-accent-active/40 hover:bg-prism-accent-active/5 transition-all mb-5 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Connect with someone from {community.name}
          </button>

          {/* Divider */}
          <div className="border-t border-prism-border mb-4" />

          {/* Reactions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(
                Object.entries(REACTION_LABELS) as [
                  ReactionType,
                  { emoji: string; label: string },
                ][]
              ).map(([type, { emoji, label }]) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-150 ${
                    activeReaction === type
                      ? "bg-prism-accent-active/20 text-prism-accent-active"
                      : "text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated"
                  }`}
                  title={label}
                >
                  <span className="text-base">{emoji}</span>
                  <span className="font-mono text-xs">
                    {reaction_count + (activeReaction === type ? 1 : 0)}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-150 ${
                bookmarked
                  ? "text-prism-accent-active bg-prism-accent-active/10"
                  : "text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated"
              }`}
              title={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill={bookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              <span className="font-mono text-xs">
                {bookmark_count + (bookmarked ? 1 : 0)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
