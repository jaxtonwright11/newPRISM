"use client";

import { useState } from "react";
import { SEED_TOPICS } from "@/lib/seed-data";
import type { TopicStatus } from "@shared/types";

const STATUS_BADGE: Record<TopicStatus, { label: string; color: string }> = {
  hot: {
    label: "HOT",
    color: "bg-prism-accent-live/20 text-prism-accent-live",
  },
  trending: {
    label: "TRENDING",
    color: "bg-prism-accent-active/20 text-prism-accent-active",
  },
  active: {
    label: "ACTIVE",
    color: "bg-prism-accent-verified/20 text-prism-accent-verified",
  },
  cooling: {
    label: "COOLING",
    color: "bg-prism-text-dim/20 text-prism-text-dim",
  },
  archived: {
    label: "ARCHIVED",
    color: "bg-prism-text-dim/20 text-prism-text-dim",
  },
};

interface TopicSidebarProps {
  selectedTopic: string;
  onTopicSelect: (slug: string) => void;
}

export function TopicSidebar({
  selectedTopic,
  onTopicSelect,
}: TopicSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = SEED_TOPICS.filter(
    (t) =>
      t.status !== "archived" &&
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hotTopics = filteredTopics.filter(
    (t) => t.status === "hot" || t.status === "trending"
  );
  const activeTopics = filteredTopics.filter((t) => t.status === "active");

  return (
    <aside className="w-[260px] h-full bg-prism-bg-secondary border-r border-prism-border flex flex-col shrink-0 hidden md:flex">
      {/* Logo */}
      <div className="p-4 border-b border-prism-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">P</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-wide text-prism-text-primary">
              PRISM
            </h1>
            <p className="text-[10px] text-prism-text-dim -mt-0.5">
              Community Perspectives
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-prism-text-dim"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-active transition-shadow"
          />
        </div>
      </div>

      {/* Topic lists */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {/* Hot / Trending */}
        {hotTopics.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-prism-accent-live animate-pulse-slow" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-prism-text-dim">
                Live Now
              </span>
            </div>
            {hotTopics.map((topic) => (
              <TopicItem
                key={topic.slug}
                title={topic.title}
                slug={topic.slug}
                status={topic.status}
                perspectiveCount={topic.perspective_count}
                communityCount={topic.community_count}
                isSelected={selectedTopic === topic.slug}
                onSelect={onTopicSelect}
              />
            ))}
          </div>
        )}

        {/* Active */}
        {activeTopics.length > 0 && (
          <div>
            <div className="px-2 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-prism-text-dim">
                Active
              </span>
            </div>
            {activeTopics.map((topic) => (
              <TopicItem
                key={topic.slug}
                title={topic.title}
                slug={topic.slug}
                status={topic.status}
                perspectiveCount={topic.perspective_count}
                communityCount={topic.community_count}
                isSelected={selectedTopic === topic.slug}
                onSelect={onTopicSelect}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function TopicItem({
  title,
  slug,
  status,
  perspectiveCount,
  communityCount,
  isSelected,
  onSelect,
}: {
  title: string;
  slug: string;
  status: TopicStatus;
  perspectiveCount: number;
  communityCount: number;
  isSelected: boolean;
  onSelect: (slug: string) => void;
}) {
  const badge = STATUS_BADGE[status];
  return (
    <button
      onClick={() => onSelect(slug)}
      className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 ${
        isSelected
          ? "bg-prism-accent-active/10 border border-prism-accent-active/30"
          : "hover:bg-prism-bg-elevated border border-transparent"
      }`}
    >
      <span className="text-sm font-medium text-prism-text-primary leading-tight line-clamp-2">
        {title}
      </span>
      <div className="flex items-center gap-2 mt-1">
        {badge && (
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.color}`}
          >
            {badge.label}
          </span>
        )}
        <span className="text-[10px] text-prism-text-dim font-mono">
          {perspectiveCount} perspectives · {communityCount} communities
        </span>
      </div>
    </button>
  );
}
