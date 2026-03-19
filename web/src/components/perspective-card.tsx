"use client";

import { useState } from "react";
import type { ReactionType } from "@shared/types";
import { REACTION_LABELS } from "@/lib/constants";

interface PerspectiveCardProps {
  community: {
    name: string;
    region: string;
    community_type: string;
    color_hex: string;
    verified: boolean;
  };
  quote: string;
  context: string;
  category_tag: string;
  reaction_count: number;
}

export function PerspectiveCard({
  community,
  quote,
  context,
  category_tag,
  reaction_count,
}: PerspectiveCardProps) {
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const handleReaction = (type: ReactionType) => {
    setActiveReaction(activeReaction === type ? null : type);
  };

  return (
    <div
      className="rounded-[10px] border border-prism-border bg-prism-bg-secondary p-5 animate-fade-in"
      style={{ borderLeftWidth: "3px", borderLeftColor: community.color_hex }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ backgroundColor: community.color_hex + "20", color: community.color_hex }}
        >
          {community.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-prism-text-primary">{community.name}</span>
            {community.verified && (
              <svg className="w-3.5 h-3.5 text-prism-accent-verified" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <span className="text-xs text-prism-text-dim">{community.region}</span>
        </div>
      </div>

      <blockquote className="font-display italic text-base leading-relaxed text-prism-text-primary mb-3">
        &ldquo;{quote}&rdquo;
      </blockquote>

      <p className="text-[13px] text-prism-text-secondary leading-snug mb-4">{context}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-0.5 rounded-full bg-prism-bg-elevated text-prism-text-dim">
          {category_tag}
        </span>
        <div className="flex items-center gap-1">
          {(Object.entries(REACTION_LABELS) as [ReactionType, { emoji: string; label: string }][]).map(
            ([type, { emoji, label }]) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                  activeReaction === type
                    ? "bg-prism-accent-active/20 text-prism-accent-active"
                    : "text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated"
                }`}
                title={label}
              >
                <span>{emoji}</span>
                <span className="font-mono text-[10px]">
                  {reaction_count + (activeReaction === type ? 1 : 0)}
                </span>
              </button>
            )
          )}
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`ml-1 p-1 rounded transition-colors ${
              bookmarked ? "text-prism-accent-active" : "text-prism-text-dim hover:text-prism-text-secondary"
            }`}
            title="Bookmark"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
