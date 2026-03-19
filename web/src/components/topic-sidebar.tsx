"use client";

import { useState } from "react";
import { SEED_TOPICS } from "@/lib/constants";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  hot: { label: "HOT", color: "bg-prism-accent-live/20 text-prism-accent-live" },
  trending: { label: "TRENDING", color: "bg-prism-accent-active/20 text-prism-accent-active" },
  active: { label: "ACTIVE", color: "bg-prism-accent-verified/20 text-prism-accent-verified" },
};

export function TopicSidebar({
  onTopicSelect,
}: {
  onTopicSelect: (slug: string) => void;
}) {
  const [selectedTopic, setSelectedTopic] = useState<string>(SEED_TOPICS[0].slug);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = SEED_TOPICS.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-[260px] h-full bg-prism-bg-secondary border-r border-prism-border flex flex-col">
      <div className="p-4 border-b border-prism-border">
        <h1 className="font-display text-xl font-bold tracking-wide text-prism-text-primary">
          PRISM
        </h1>
        <p className="text-xs text-prism-text-dim mt-0.5">Community Perspectives</p>
      </div>

      <div className="p-3">
        <input
          type="text"
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-active"
        />
      </div>

      <div className="p-2 flex-1 overflow-y-auto">
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-prism-text-dim">
          Live Now
        </p>
        {filteredTopics.map((topic) => {
          const badge = STATUS_BADGE[topic.status];
          return (
            <button
              key={topic.slug}
              onClick={() => {
                setSelectedTopic(topic.slug);
                onTopicSelect(topic.slug);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                selectedTopic === topic.slug
                  ? "bg-prism-accent-active/10 border border-prism-accent-active/30"
                  : "hover:bg-prism-bg-elevated border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-prism-text-primary leading-tight">
                  {topic.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
                <span className="text-[10px] text-prism-text-dim font-mono">
                  {topic.community_count} communities
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
