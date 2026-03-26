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
      <div className="px-4 py-3 border-b border-prism-border">
        <span className="text-[10px] font-mono uppercase tracking-widest text-prism-accent-primary">
          Same topic &middot; Different worlds
        </span>
        <h3 className="text-sm font-display font-semibold text-prism-text-primary mt-0.5">
          {topicTitle}
        </h3>
      </div>

      {/* Stacked perspectives */}
      <div className="divide-y divide-prism-border">
        {shown.map((p, i) => (
          <motion.button
            key={p.id}
            className="w-full text-left px-4 py-4 relative hover:bg-prism-bg-elevated transition-colors"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.12 }}
            onClick={() => onSelectPerspective?.(p.id)}
          >
            {/* Community color accent */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ backgroundColor: p.community.color_hex }}
            />
            <div className="pl-2">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.community.color_hex }}
                />
                <span className="text-xs font-medium text-prism-text-primary">
                  {p.community.name}
                </span>
                <span className="text-[10px] text-prism-text-dim">
                  {p.community.region}
                </span>
              </div>
              <p className="text-[14px] leading-relaxed text-prism-text-primary font-body">
                &ldquo;{p.quote}&rdquo;
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer */}
      {perspectives.length > 3 && (
        <div className="px-4 py-2.5 border-t border-prism-border">
          <span className="text-[10px] text-prism-text-dim font-mono">
            +{perspectives.length - 3} more perspectives
          </span>
        </div>
      )}
    </motion.div>
  );
}
