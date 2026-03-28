"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import type { CommunityType } from "@shared/types";

interface ComparisonPerspective {
  id: string;
  quote: string;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
  };
}

interface PerspectiveComparisonProps {
  topicTitle: string;
  perspectives: ComparisonPerspective[];
  onSelectPerspective?: (id: string) => void;
}

export function PerspectiveComparison({
  topicTitle,
  perspectives,
  onSelectPerspective,
}: PerspectiveComparisonProps) {
  const { session } = useAuth();
  const [neverKnewSent, setNeverKnewSent] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Show up to 4 perspectives in comparison
  const shown = perspectives.slice(0, 4);

  const handleNeverKnew = useCallback(async () => {
    if (neverKnewSent || !session?.access_token) return;
    setNeverKnewSent(true);

    // Record the "I never knew" reaction for the comparison
    try {
      for (const p of shown) {
        await fetch(`/api/perspectives/${p.id}/react`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reaction_type: "want_to_understand" }),
        });
      }
    } catch {
      // Non-critical
    }
  }, [neverKnewSent, session?.access_token, shown]);

  const handleShare = useCallback(() => {
    const ids = shown.map((p) => p.id).join(",");
    const url = `${window.location.origin}/compare?ids=${ids}`;
    setShareUrl(url);

    if (navigator.share) {
      navigator.share({
        title: `PRISM: ${topicTitle}`,
        text: `See how different communities experience "${topicTitle}"`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }, [shown, topicTitle]);

  if (perspectives.length < 2) return null;

  // On desktop with 4 perspectives, use a 2x2 grid
  const useGrid = shown.length >= 4;

  return (
    <motion.div
      className="rounded-xl bg-prism-bg-surface border border-prism-border overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-prism-border flex items-start gap-3">
        <div className="w-[3px] h-8 rounded-full bg-prism-accent-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="text-xs font-mono uppercase tracking-widest text-prism-accent-primary font-medium">
            Same topic &middot; Different worlds
          </span>
          <h3 className="text-base font-display font-bold text-prism-text-primary mt-0.5 tracking-tight">
            {topicTitle}
          </h3>
        </div>
      </div>

      {/* Perspectives — 2x2 grid on desktop for 4 items, stacked otherwise */}
      <div className={useGrid
        ? "grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-prism-border/50"
        : "divide-y divide-prism-border/50"
      }>
        {shown.map((p, i) => (
          <motion.button
            key={p.id}
            className="w-full text-left px-4 py-4 relative hover:bg-prism-bg-elevated/50 transition-colors group"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.15 }}
            onClick={() => onSelectPerspective?.(p.id)}
          >
            {/* Community color accent bar */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
              style={{ backgroundColor: p.community.color_hex }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.15, ease: "easeOut" }}
            />

            {/* Subtle community color wash */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundColor: p.community.color_hex }}
            />

            <div className="pl-3 relative">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: p.community.color_hex,
                    boxShadow: `0 0 6px ${p.community.color_hex}40`,
                  }}
                />
                <span className="text-[13px] font-semibold text-prism-text-secondary">
                  {p.community.name}
                </span>
                <span className="text-[10px] text-prism-text-dim">
                  {p.community.region}
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-prism-text-primary font-body font-medium">
                &ldquo;{p.quote}&rdquo;
              </p>
            </div>

            {/* Hover arrow */}
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-prism-text-dim opacity-0 group-hover:opacity-60 transition-opacity"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        ))}
      </div>

      {/* Footer: "I never knew" reaction + share + overflow count */}
      <div className="px-4 py-3 border-t border-prism-border/50 flex items-center gap-3">
        {session && (
          <button
            onClick={handleNeverKnew}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              neverKnewSent
                ? "bg-prism-accent-primary/20 text-prism-accent-primary"
                : "bg-prism-bg-elevated text-prism-text-secondary hover:text-prism-text-primary hover:bg-prism-bg-overlay"
            }`}
            aria-label="I never knew people experienced this"
          >
            <span className="text-sm">💡</span>
            {neverKnewSent ? "Eye-opening" : "I never knew"}
          </button>
        )}

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-prism-bg-elevated text-prism-text-secondary hover:text-prism-text-primary hover:bg-prism-bg-overlay transition-all ml-auto"
          aria-label="Share comparison"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
          </svg>
          {shareUrl ? "Copied!" : "Share"}
        </button>

        {perspectives.length > 4 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {perspectives.slice(4, 7).map((p) => (
                <div
                  key={p.id}
                  className="w-2 h-2 rounded-full border border-prism-bg-surface"
                  style={{ backgroundColor: p.community.color_hex }}
                />
              ))}
            </div>
            <span className="text-xs text-prism-text-secondary font-body">
              +{perspectives.length - 4} more perspectives
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
