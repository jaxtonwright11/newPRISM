"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import type { CommunityType, ReactionType } from "@shared/types";
import { REACTION_LABELS } from "@/lib/constants";

interface PerspectiveCardProps {
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
  bookmark_count?: number;
  isNew?: boolean;
  onSelect?: (id: string) => void;
  animationDelay?: number;
}

export function PerspectiveCard({
  id,
  community,
  quote,
  context,
  category_tag,
  reaction_count,
  bookmark_count = 0,
  isNew = false,
  onSelect,
  animationDelay = 0,
}: PerspectiveCardProps) {
  const { session } = useAuth();
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [localReactionDelta, setLocalReactionDelta] = useState(0);

  const handleReaction = useCallback(
    async (type: ReactionType) => {
      const wasActive = activeReaction === type;

      // Optimistic update
      if (wasActive) {
        setActiveReaction(null);
        setLocalReactionDelta((d) => d - 1);
      } else {
        const hadPrevious = activeReaction !== null;
        setActiveReaction(type);
        if (!hadPrevious) setLocalReactionDelta((d) => d + 1);
      }

      if (!session?.access_token) return;

      try {
        if (wasActive) {
          // Remove reaction
          const res = await fetch(`/api/perspectives/${id}/react`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (!res.ok) throw new Error();
        } else {
          // Set reaction
          const res = await fetch(`/api/perspectives/${id}/react`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ reaction_type: type }),
          });
          if (!res.ok) throw new Error();
        }
      } catch {
        // Rollback on failure
        if (wasActive) {
          setActiveReaction(type);
          setLocalReactionDelta((d) => d + 1);
        } else {
          setActiveReaction(null);
          setLocalReactionDelta((d) => d - 1);
        }
      }
    },
    [activeReaction, id, session?.access_token]
  );

  const handleBookmark = useCallback(async () => {
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);

    if (!session?.access_token) return;

    try {
      if (wasBookmarked) {
        const res = await fetch(`/api/perspectives/${id}/bookmark`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(`/api/perspectives/${id}/bookmark`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error();
      }
    } catch {
      setBookmarked(wasBookmarked);
    }
  }, [bookmarked, id, session?.access_token]);

  return (
    <div
      className="rounded-[10px] border border-prism-border bg-prism-bg-secondary p-5 opacity-0 animate-fade-in cursor-pointer hover:bg-prism-bg-elevated/50 transition-colors duration-200 group relative"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: community.color_hex,
        animationDelay: `${animationDelay}ms`,
        animationFillMode: "forwards",
      }}
      onClick={() => onSelect?.(id)}
      role="article"
      tabIndex={0}
    >
      {/* NEW TO YOU indicator for Discover tab */}
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-prism-accent-active text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg">
          NEW TO YOU
        </div>
      )}

      {/* Community header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-prism-text-primary truncate">
              {community.name}
            </span>
            {community.verified && (
              <svg
                className="w-3.5 h-3.5 text-prism-accent-verified shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
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

      {/* Quote — the most important element */}
      <blockquote className="font-display italic text-base leading-relaxed text-prism-text-primary mb-3">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Context */}
      <p className="text-[13px] text-prism-text-secondary leading-snug mb-4">
        {context}
      </p>

      {/* Footer: category tag + reactions */}
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-0.5 rounded-full bg-prism-bg-elevated text-prism-text-dim">
          {category_tag}
        </span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {(
            Object.entries(REACTION_LABELS) as [
              ReactionType,
              { emoji: string; label: string },
            ][]
          ).map(([type, { emoji, label }]) => (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-150 ${
                activeReaction === type
                  ? "bg-prism-accent-active/20 text-prism-accent-active scale-105"
                  : "text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated"
              }`}
              title={label}
              aria-label={label}
            >
              <span>{emoji}</span>
              <span className="font-mono text-[10px]">
                {reaction_count + localReactionDelta}
              </span>
            </button>
          ))}
          <button
            onClick={handleBookmark}
            className={`ml-1 p-1 rounded transition-all duration-150 ${
              bookmarked
                ? "text-prism-accent-active"
                : "text-prism-text-dim hover:text-prism-text-secondary"
            }`}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
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
            {bookmark_count > 0 && (
              <span className="font-mono text-[10px] ml-0.5">
                {bookmark_count + (bookmarked ? 1 : 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `${community.name} perspective`, text: quote }).catch(() => {});
              } else {
                navigator.clipboard.writeText(quote).catch(() => {});
              }
            }}
            className="p-1 rounded text-prism-text-dim hover:text-prism-text-secondary transition-all duration-150"
            title="Share"
            aria-label="Share"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
