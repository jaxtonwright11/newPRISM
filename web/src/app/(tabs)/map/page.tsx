"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPlaceholder } from "@/components/map-placeholder";
import type { Community, Topic } from "@shared/types";

export default function MapPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => setCommunities(data.communities ?? data ?? []))
      .catch(() => {});
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        const topics = data.topics ?? [];
        const hot = topics.find((t: Topic) => t.status === "hot");
        const trending = topics.find((t: Topic) => t.status === "trending");
        setActiveTopic(hot ?? trending ?? topics[0] ?? null);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] md:h-screen relative">
      <MapPlaceholder communities={communities} />

      {/* Active Now overlay */}
      {activeTopic && (
        <Link
          href={`/topic/${activeTopic.slug}`}
          className="absolute top-4 left-4 right-4 z-20 max-w-sm"
        >
          <div className="bg-prism-bg-surface/95 backdrop-blur-md rounded-xl border border-prism-border p-3 shadow-lg shadow-black/30 hover:bg-prism-bg-elevated/95 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-prism-accent-live opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-prism-accent-live" />
              </span>
              <span className="text-[10px] font-semibold text-prism-accent-live uppercase tracking-wider">
                Active Now
              </span>
            </div>
            <p className="text-sm font-medium text-prism-text-primary">{activeTopic.title}</p>
            {activeTopic.summary && (
              <p className="text-xs text-prism-text-dim mt-0.5 line-clamp-1">{activeTopic.summary}</p>
            )}
            <p className="text-[10px] text-prism-accent-primary mt-1.5">
              Tap to see how communities are experiencing this →
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}
