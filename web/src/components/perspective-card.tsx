"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { prismEvents } from "@/lib/posthog";
import type { CommunityType, ReactionType } from "@shared/types";
import { REACTION_LABELS } from "@/lib/constants";
import { ShareButton } from "@/components/share-button";
import { ReportButton } from "@/components/report-button";

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
  context: string | null;
  category_tag: string | null;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bookmark_count = 0,
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

      if (wasActive) {
        setActiveReaction(null);
        setLocalReactionDelta((d) => d - 1);
      } else {
        const hadPrevious = activeReaction !== null;
        setActiveReaction(type);
        if (!hadPrevious) setLocalReactionDelta((d) => d + 1);
        prismEvents.perspectiveCardReaction(type, id);
      }

      if (!session?.access_token) return;

      try {
        if (wasActive) {
          const res = await fetch(`/api/perspectives/${id}/react`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (!res.ok) throw new Error();
        } else {
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

  const totalReactions = reaction_count + localReactionDelta;

  return (
    <motion.div
      className="relative rounded-xl bg-[var(--bg-surface)] overflow-hidden cursor-pointer group transition-all duration-200 hover:bg-[var(--bg-elevated)] hover:shadow-lg hover:shadow-black/20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay / 1000, ease: "easeOut" }}
      onClick={() => onSelect?.(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(id);
        }
      }}
      role="article"
      tabIndex={0}
      aria-label={`Perspective from ${community.name}: ${quote.slice(0, 80)}`}
    >
      {/* Community color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: community.color_hex }}
      />

      <div className="p-4 pl-5">
        {/* Community header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-2 h-2 rounded-full shrink-0 ring-2 ring-current/10"
            style={{ backgroundColor: community.color_hex, color: community.color_hex }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold font-body text-[var(--text-primary)] truncate">
              {community.name}
            </span>
            <span className="text-xs text-[var(--text-dim)] ml-2 font-body">{community.region}</span>
          </div>
        </div>

        {/* Quote */}
        <p className="font-body text-[15px] leading-[1.65] text-[var(--text-primary)] mb-3">
          &ldquo;{quote}&rdquo;
        </p>

        {/* Context */}
        {context && (
          <p className="text-[13px] text-[var(--text-secondary)] leading-snug mb-4">
            {context}
          </p>
        )}

      {/* Footer: category tag + reactions */}
      <div className="flex items-center justify-between">
        {category_tag && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-dim)] font-body">
            {category_tag}
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
          {(
            Object.entries(REACTION_LABELS) as [
              ReactionType,
              { emoji: string; label: string },
            ][]
          ).map(([type, { emoji, label }]) => (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs transition-all duration-150 min-h-[36px] ${
                activeReaction === type
                  ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] scale-105"
                  : "text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              }`}
              title={label}
              aria-label={label}
            >
              <span>{emoji}</span>
              {totalReactions > 0 && (
                <span className="font-mono text-[10px]">{totalReactions}</span>
              )}
            </button>
          ))}
          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded transition-all duration-150 ${
              bookmarked
                ? "text-[var(--accent-primary)]"
                : "text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
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
          </button>
          <ShareButton perspectiveId={id} quote={quote} />
          <ReportButton contentType="perspective" contentId={id} />
        </div>
      </div>
      </div>
    </motion.div>
  );
}
