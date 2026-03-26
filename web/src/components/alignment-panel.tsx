"use client";

import type { CommunityAlignment, Community } from "@shared/types";

interface AlignmentPanelProps {
  alignments: CommunityAlignment[];
  topicTitle?: string;
  communities?: Community[];
}

export function AlignmentPanel({ alignments, topicTitle, communities = [] }: AlignmentPanelProps) {
  const sorted = [...alignments].sort(
    (a, b) => b.agreement_pct - a.agreement_pct
  );

  const topAgreement = sorted[0]?.agreement_pct ?? 0;

  function getCommunityColor(id: string): string {
    const community = communities.find((c) => c.id === id);
    return community?.color_hex ?? "#5C6370";
  }

  function getCommunityName(id: string): string {
    const community = communities.find((c) => c.id === id);
    return community?.name ?? "Unknown";
  }

  return (
    <aside className="w-[320px] h-full bg-prism-bg-surface border-l border-prism-border flex flex-col shrink-0 hidden lg:flex">
      {/* Header */}
      <div className="p-4 border-b border-prism-border">
        <h2 className="text-sm font-semibold text-prism-text-primary">
          Cross-Community Alignment
        </h2>
        <p className="text-xs text-prism-text-dim mt-0.5">
          {topicTitle ? `Where communities agree on "${topicTitle}"` : "Where communities agree"}
        </p>
      </div>

      {/* Top stat */}
      {sorted.length > 0 && (
        <div className="p-3 border-b border-prism-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-prism-text-dim">
              Highest Agreement
            </span>
            <span className="font-mono text-lg font-bold text-prism-accent-live">
              {topAgreement}%
            </span>
          </div>
        </div>
      )}

      {/* Alignment cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sorted.length > 0 ? (
          sorted.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-prism-bg-elevated border border-prism-border"
            >
              <p className="text-sm font-display italic text-prism-text-primary leading-snug mb-3">
                &ldquo;{item.alignment_statement}&rdquo;
              </p>

              {/* Agreement bar */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex-1 h-1.5 bg-prism-bg-base rounded-full overflow-hidden">
                  <div
                    className="h-full bg-prism-accent-live rounded-full transition-all duration-500"
                    style={{ width: `${item.agreement_pct}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-prism-accent-live font-bold w-10 text-right">
                  {item.agreement_pct}%
                </span>
              </div>

              {/* Community tags with colors */}
              <div className="flex flex-wrap gap-1">
                {item.community_ids.map((cid) => (
                  <span
                    key={cid}
                    className="text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                    style={{
                      backgroundColor: getCommunityColor(cid) + "15",
                      color: getCommunityColor(cid),
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getCommunityColor(cid) }}
                    />
                    {getCommunityName(cid)}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-prism-text-dim">
              Select a topic to see alignment data.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
