"use client";

import { useState } from "react";
import Link from "next/link";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { TopicStatus, Topic, Community } from "@shared/types";

const STATUS_DOT: Record<TopicStatus, string> = {
  hot: "bg-prism-accent-primary",
  trending: "bg-prism-accent-primary/60",
  active: "bg-prism-accent-live/60",
  cooling: "bg-prism-text-dim/40",
  archived: "bg-prism-text-dim/20",
};

interface TopicSidebarProps {
  topics: Topic[];
  communities: Community[];
  selectedTopic: string;
  onTopicSelect: (slug: string) => void;
}

export function TopicSidebar({
  topics,
  communities,
  selectedTopic,
  onTopicSelect,
}: TopicSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = topics.filter(
    (t) =>
      t.status !== "archived" &&
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hotTopics = filteredTopics.filter(
    (t) => t.status === "hot" || t.status === "trending"
  );
  const activeTopics = filteredTopics.filter((t) => t.status === "active");

  return (
    <aside className="w-[260px] h-full bg-prism-bg-surface border-r border-prism-border flex flex-col shrink-0 hidden md:flex">
      {/* Logo */}
      <div className="p-4 border-b border-prism-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-prism-accent-primary to-prism-community-diaspora flex items-center justify-center">
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
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-primary transition-shadow"
          />
        </div>
      </div>

      {/* Topic lists */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {topics.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-prism-text-dim">No topics yet.</p>
            <p className="text-[10px] text-prism-text-dim/60 mt-1">
              Topics will appear here as communities start sharing perspectives.
            </p>
          </div>
        ) : (
          <>
            {/* Active topics */}
            {hotTopics.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-prism-text-dim">
                    Active Topics
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

            {/* Other topics */}
            {activeTopics.length > 0 && (
              <div>
                <div className="px-2 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-prism-text-dim">
                    More Topics
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

            {/* Communities active on selected topic */}
            <ActiveCommunities communities={communities} />
          </>
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
  const dotColor = STATUS_DOT[status];
  return (
    <button
      onClick={() => onSelect(slug)}
      className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 ${
        isSelected
          ? "bg-prism-accent-primary/10 border border-prism-accent-primary/30"
          : "hover:bg-prism-bg-elevated border border-transparent"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
        <div className="min-w-0">
          <span className="text-sm font-medium text-prism-text-primary leading-tight line-clamp-2">
            {title}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-prism-text-dim font-mono">
              {communityCount} communities · {perspectiveCount} perspectives
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ActiveCommunities({ communities }: { communities: Community[] }) {
  if (communities.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-prism-border">
      <div className="px-2 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-prism-text-dim">
          Communities on this topic
        </span>
      </div>
      <div className="space-y-0.5">
        {communities.map((community) => (
          <Link
            key={community.id}
            href={`/community/${community.id}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-prism-bg-elevated transition-colors"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COMMUNITY_COLORS[community.community_type] }}
            />
            <span className="text-xs text-prism-text-secondary truncate">{community.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
