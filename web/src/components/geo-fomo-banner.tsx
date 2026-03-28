"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NearbyActivity {
  topic_name: string;
  community_count: number;
}

/**
 * Geographic FOMO Banner — shows when communities near the user are active.
 * Dismissible per session.
 */
export function GeoFomoBanner() {
  const [activity, setActivity] = useState<NearbyActivity | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("prism_fomo_dismissed")) {
      setDismissed(true);
      return;
    }

    // Detect location and fetch nearby activity
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/feed/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&limit=20`
          );
          const data = await res.json();
          const perspectives = data.perspectives ?? [];

          // Check for recent activity (last 2 hours)
          const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
          const recent = perspectives.filter(
            (p: { created_at?: string }) =>
              p.created_at && new Date(p.created_at).getTime() > twoHoursAgo
          );

          if (recent.length >= 3) {
            // Find the most common topic among recent perspectives
            const topicCounts: Record<string, { name: string; count: number }> = {};
            const communities = new Set<string>();
            for (const p of recent) {
              const topicName = p.topic?.title ?? p.community?.name ?? "a topic";
              const communityName = p.community?.name ?? "";
              if (!topicCounts[topicName]) topicCounts[topicName] = { name: topicName, count: 0 };
              topicCounts[topicName].count++;
              if (communityName) communities.add(communityName);
            }

            const topTopic = Object.values(topicCounts).sort((a, b) => b.count - a.count)[0];

            setActivity({
              topic_name: topTopic?.name ?? "local events",
              community_count: communities.size,
            });
          }
        } catch {
          // Silently fail
        }
      },
      () => {} // Location denied — no banner
    );
  }, []);

  if (dismissed || !activity) return null;

  return (
    <div className="mx-4 mb-3 bg-prism-accent-primary/8 border border-prism-accent-primary/20 rounded-xl p-3 flex items-center gap-3">
      <div className="flex-shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-prism-accent-live opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-prism-accent-live" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-prism-text-primary font-medium">
          {activity.community_count} communit{activity.community_count === 1 ? "y" : "ies"} in your region just posted about{" "}
          <span className="text-prism-accent-primary">{activity.topic_name}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/discover"
          className="text-[10px] font-medium text-prism-accent-primary hover:underline"
        >
          See
        </Link>
        <button
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem("prism_fomo_dismissed", "1");
          }}
          className="text-prism-text-dim hover:text-prism-text-secondary transition-colors p-0.5"
          aria-label="Dismiss"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
