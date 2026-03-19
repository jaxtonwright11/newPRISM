export function AlignmentPanel() {
  const alignments = [
    {
      statement: "Border communities need more direct federal engagement, not just enforcement presence",
      communities: ["Mexican-American Diaspora", "Rural Border Towns", "Policy Wonks DC"],
      agreement_pct: 87,
    },
    {
      statement: "Remote work has permanently changed the relationship between cities and rural areas",
      communities: ["Rural Appalachia", "Bay Area Tech Workers", "Academic Economists"],
      agreement_pct: 74,
    },
  ];

  return (
    <aside className="w-[320px] h-full bg-prism-bg-secondary border-l border-prism-border flex flex-col">
      <div className="p-4 border-b border-prism-border">
        <h2 className="text-sm font-semibold text-prism-text-primary">Cross-Community Alignment</h2>
        <p className="text-xs text-prism-text-dim mt-0.5">Where communities agree</p>
      </div>

      <div className="p-3 border-b border-prism-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-prism-text-dim">
            Most Agreed
          </span>
          <span className="font-mono text-lg font-bold text-prism-accent-verified">
            {alignments[0].agreement_pct}%
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {alignments.map((item, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-prism-bg-elevated border border-prism-border"
          >
            <p className="text-sm text-prism-text-primary leading-snug mb-2">
              &ldquo;{item.statement}&rdquo;
            </p>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-prism-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-prism-accent-verified rounded-full transition-all"
                  style={{ width: `${item.agreement_pct}%` }}
                />
              </div>
              <span className="font-mono text-xs text-prism-accent-verified font-bold">
                {item.agreement_pct}%
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {item.communities.map((c) => (
                <span
                  key={c}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-prism-bg-primary text-prism-text-dim"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
