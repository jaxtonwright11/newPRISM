"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { CommunityType, ReactionType } from "@shared/types";
import { REACTION_LABELS, COMMUNITY_COLORS } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { prismEvents } from "@/lib/posthog";

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
  context: string | null;
  category_tag: string | null;
  reaction_count: number;
  bookmark_count: number;
  created_at?: string;
  onClose: () => void;
}

export function PerspectiveDetail({
  id,
  community,
  quote,
  context,
  category_tag,
  reaction_count,
  bookmark_count,
  created_at,
  onClose,
}: PerspectiveDetailProps) {
  const { session } = useAuth();

  // Track perspective view
  useEffect(() => {
    prismEvents.perspectiveCardViewed(id, community.community_type, category_tag ?? "");
  }, [id, community.community_type, category_tag]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Swipe down to dismiss
  const [swipeY, setSwipeY] = useState(0);
  const touchStartY = useRef(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = modalRef.current;
    if (el && el.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && touchStartY.current > 0) {
      setSwipeY(delta * 0.5);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeY > 120) {
      onClose();
    }
    setSwipeY(0);
    touchStartY.current = 0;
  }, [swipeY, onClose]);

  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
  const [localReactionDelta, setLocalReactionDelta] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  const handleReaction = useCallback(async (type: ReactionType) => {
    const wasActive = activeReaction === type;

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
        await fetch(`/api/perspectives/${id}/react`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } else {
        await fetch(`/api/perspectives/${id}/react`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reaction_type: type }),
        });
      }
    } catch {
      // Revert on failure
      if (wasActive) {
        setActiveReaction(type);
        setLocalReactionDelta((d) => d + 1);
      } else {
        setActiveReaction(null);
        setLocalReactionDelta((d) => d - 1);
      }
    }
  }, [activeReaction, id, session?.access_token]);

  const handleBookmark = useCallback(async () => {
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);

    if (!session?.access_token) return;

    try {
      await fetch(`/api/perspectives/${id}/bookmark`, {
        method: wasBookmarked ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch {
      setBookmarked(wasBookmarked);
    }
  }, [bookmarked, id, session?.access_token]);

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-prism-bg-surface border border-prism-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in transition-transform"
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: community.color_hex,
          transform: swipeY > 0 ? `translateY(${swipeY}px)` : undefined,
          opacity: swipeY > 0 ? Math.max(0.3, 1 - swipeY / 300) : 1,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicator */}
        <div className="flex justify-center pt-2 pb-1 md:hidden">
          <div className="w-8 h-1 rounded-full bg-prism-text-dim/30" />
        </div>
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
                  <svg className="w-4 h-4 text-prism-accent-live" viewBox="0 0 20 20" fill="currentColor">
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
          <blockquote className="font-body text-xl leading-relaxed text-prism-text-primary mb-4 border-l-0">
            &ldquo;{quote}&rdquo;
          </blockquote>

          {/* Context */}
          {context && (
            <p className="text-sm text-prism-text-secondary leading-relaxed mb-6">
              {context}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-3 mb-6">
            {category_tag && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-prism-bg-elevated text-prism-text-dim">
                {category_tag}
              </span>
            )}
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
                      ? "bg-prism-accent-primary/20 text-prism-accent-primary"
                      : "text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated"
                  }`}
                  title={label}
                >
                  <span className="text-base">{emoji}</span>
                  <span className="font-mono text-xs">
                    {reaction_count + localReactionDelta}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-150 ${
                  bookmarked
                    ? "text-prism-accent-primary bg-prism-accent-primary/10"
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
              <button
                onClick={() => {
                  const url = `${window.location.origin}/perspective/${id}`;
                  if (navigator.share) {
                    navigator.share({ title: `${community.name} on PRISM`, text: `"${quote}"`, url }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(url).catch(() => {});
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated transition-all duration-150"
                title="Share"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                <span className="text-xs">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
