"use client";

import { motion } from "framer-motion";
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
  if (perspectives.length < 2) return null;

  // Show up to 3 perspectives in the comparison
  const shown = perspectives.slice(0, 3);

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
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-prism-accent-primary font-medium">
            Same topic &middot; Different worlds
          </span>
          <h3 className="text-base font-display font-bold text-prism-text-primary mt-0.5 tracking-tight">
            {topicTitle}
          </h3>
        </div>
      </div>

      {/* Stacked perspectives */}
      <div className="divide-y divide-prism-border/50">
        {shown.map((p, i) => (
          <motion.button
            key={p.id}
            className="w-full text-left px-4 py-4 relative hover:bg-prism-bg-elevated/50 transition-colors group"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.2 }}
            onClick={() => onSelectPerspective?.(p.id)}
          >
            {/* Community color accent bar — animates in */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
              style={{ backgroundColor: p.community.color_hex }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.2, ease: "easeOut" }}
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

      {/* Footer */}
      {perspectives.length > 3 && (
        <div className="px-4 py-3 border-t border-prism-border/50 flex items-center gap-2">
          <div className="flex -space-x-1">
            {perspectives.slice(3, 6).map((p) => (
              <div
                key={p.id}
                className="w-2 h-2 rounded-full border border-prism-bg-surface"
                style={{ backgroundColor: p.community.color_hex }}
              />
            ))}
          </div>
          <span className="text-xs text-prism-text-secondary font-body">
            +{perspectives.length - 3} more perspectives
          </span>
        </div>
      )}
    </motion.div>
  );
}
