import type { CommunityAlignment, Community } from "../../../shared/types";

interface AlignmentPanelProps {
  alignments: CommunityAlignment[];
  communities: Community[];
}

export function AlignmentPanel({ alignments, communities }: AlignmentPanelProps) {
  const communityMap = new Map(communities.map((c) => [c.id, c]));

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Cross-Community Alignment
        </h3>
      </div>

      {alignments.map((alignment) => (
        <div key={alignment.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              {alignment.agreement_pct}%
            </span>
            <span className="text-xs text-muted-foreground">agreement</span>
          </div>
          <p className="text-xs leading-relaxed text-foreground/80">
            {alignment.alignment_statement}
          </p>
          <div className="flex gap-1">
            {alignment.community_ids.map((cid) => {
              const c = communityMap.get(cid);
              return c ? (
                <span
                  key={cid}
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${c.color_hex}20`,
                    color: c.color_hex,
                  }}
                >
                  {c.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
