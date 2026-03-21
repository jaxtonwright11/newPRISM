"use client";

import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

interface HeatPerspective {
  id: string;
  quote: string;
  context: string | null;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    verified: boolean;
  };
}

interface HeatPerspectivesPanelProps {
  open: boolean;
  onClose: () => void;
  communityCount: number;
  perspectives: HeatPerspective[];
}

export function HeatPerspectivesPanel({
  open,
  onClose,
  communityCount,
  perspectives,
}: HeatPerspectivesPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-hidden rounded-t-2xl bg-prism-bg-secondary border-t border-prism-border animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-prism-border" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-prism-border">
          <h3 className="text-sm font-semibold text-prism-text-primary">
            {communityCount} Communities on This Topic
          </h3>
          <p className="text-[11px] text-prism-text-dim mt-0.5">
            See how different communities experience the same issue
          </p>
        </div>

        {/* Perspectives side by side */}
        <div className="overflow-y-auto p-4 space-y-3 max-h-[55vh]">
          {perspectives.length > 0 ? (
            perspectives.map((p) => {
              const color = COMMUNITY_COLORS[p.community.community_type];
              return (
                <div
                  key={p.id}
                  className="bg-prism-bg-elevated rounded-xl p-4 border border-prism-border"
                  style={{ borderLeftWidth: "3px", borderLeftColor: color }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      {p.community.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-prism-text-primary">
                          {p.community.name}
                        </span>
                        {p.community.verified && (
                          <svg className="w-3 h-3 text-prism-accent-verified" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[10px] text-prism-text-dim">{p.community.region}</span>
                    </div>
                  </div>
                  <blockquote className="font-display italic text-sm leading-relaxed text-prism-text-primary">
                    &ldquo;{p.quote}&rdquo;
                  </blockquote>
                  {p.context && (
                    <p className="text-xs text-prism-text-secondary mt-2 leading-relaxed">
                      {p.context}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-prism-text-dim">No perspectives available for this region yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
