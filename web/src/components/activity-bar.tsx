"use client";

import { useEffect, useState } from "react";

interface Stats {
  communities_active: number;
  perspectives_this_week: number;
  topics_active: number;
}

export function ActivityBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => {});
  }, []);

  if (!stats || (stats.communities_active === 0 && stats.perspectives_this_week === 0)) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 text-[10px] font-mono text-[var(--text-dim)] border-b border-[var(--bg-elevated)]">
      {stats.communities_active > 0 && (
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-live)] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent-live)]" />
          </span>
          {stats.communities_active} {stats.communities_active === 1 ? "community" : "communities"} active
        </span>
      )}
      {stats.perspectives_this_week > 0 && (
        <span>{stats.perspectives_this_week} perspectives this week</span>
      )}
      {stats.topics_active > 0 && (
        <span>{stats.topics_active} topics</span>
      )}
    </div>
  );
}
