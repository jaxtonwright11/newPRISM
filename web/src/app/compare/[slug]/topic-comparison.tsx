"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { prismEvents } from "@/lib/posthog";

interface Perspective {
  id: string;
  quote: string;
  community: {
    name: string;
    region: string;
    community_type: string;
    color_hex: string;
  };
}

interface TopicComparisonProps {
  topicTitle: string;
  topicSummary: string | null;
  perspectives: Perspective[];
  slug: string;
}

export function TopicComparison({ topicTitle, topicSummary, perspectives, slug }: TopicComparisonProps) {
  const [shared, setShared] = useState(false);
  const shown = perspectives.slice(0, 4);

  // Track comparison view for activation funnel
  useEffect(() => {
    const uniqueCommunities = new Set(perspectives.map((p) => p.community.name));
    prismEvents.activationComparisonViewed(slug, uniqueCommunities.size);
  }, [slug, perspectives]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/compare/${slug}`;

    if (navigator.share) {
      navigator.share({
        title: `PRISM: ${topicTitle}`,
        text: `See how different communities experience "${topicTitle}"`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => setShared(true)).catch(() => {});
      setTimeout(() => setShared(false), 2000);
    }
  }, [slug, topicTitle]);

  const useGrid = shown.length >= 4;

  return (
    <motion.div
      className="rounded-xl bg-prism-bg-surface border border-prism-border overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-prism-border">
        <span className="text-xs font-mono uppercase tracking-widest text-prism-accent-primary font-medium">
          Same topic &middot; Different worlds
        </span>
        <h1 className="text-xl font-display font-bold text-prism-text-primary mt-1 tracking-tight">
          {topicTitle}
        </h1>
        {topicSummary && (
          <p className="text-sm text-prism-text-secondary mt-1.5 leading-relaxed">{topicSummary}</p>
        )}
      </div>

      {/* Perspectives */}
      <div className={useGrid
        ? "grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-prism-border/50"
        : "divide-y divide-prism-border/50"
      }>
        {shown.map((p, i) => (
          <motion.div
            key={p.id}
            className="px-5 py-4 relative"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.15 }}
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
                {p.community.region && (
                  <span className="text-[10px] text-prism-text-dim">
                    {p.community.region}
                  </span>
                )}
              </div>
              <p className="text-[15px] leading-relaxed text-prism-text-primary font-body font-medium">
                &ldquo;{p.quote}&rdquo;
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-prism-border/50 flex items-center justify-between">
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
            <span className="text-xs text-prism-text-secondary">
              +{perspectives.length - 4} more
            </span>
          </div>
        )}

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-prism-bg-elevated text-prism-text-secondary hover:text-prism-text-primary hover:bg-prism-bg-overlay transition-all ml-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
          </svg>
          {shared ? "Copied!" : "Share this comparison"}
        </button>
      </div>
    </motion.div>
  );
}
