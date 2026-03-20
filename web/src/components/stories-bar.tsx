"use client";

import { useState } from "react";
import type { CommunityType } from "@shared/types";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { StoryGroup } from "@/lib/seed-data";

interface StoriesBarProps {
  storyGroups: StoryGroup[];
  onStorySelect?: (group: StoryGroup) => void;
}

export function StoriesBar({ storyGroups, onStorySelect }: StoriesBarProps) {
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);

  const handleSelect = (group: StoryGroup) => {
    setSelectedGroup(group);
    setStoryIndex(0);
    onStorySelect?.(group);
  };

  const handleClose = () => {
    setSelectedGroup(null);
    setStoryIndex(0);
  };

  const handleNext = () => {
    if (!selectedGroup) return;
    if (storyIndex < selectedGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-3 md:px-4 py-3 scrollbar-hide">
        {storyGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => handleSelect(group)}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div
              className={`relative w-14 h-14 rounded-full p-[2.5px] ${
                group.hasUnread ? "animate-story-ring" : ""
              }`}
              style={{
                background: group.hasUnread
                  ? "linear-gradient(135deg, #FF6B8A, #F59E0B)"
                  : "#2A2A3A",
              }}
            >
              <div className="w-full h-full rounded-full bg-prism-bg-primary p-[2px]">
                <div
                  className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: group.colorHex + "20",
                    color: group.colorHex,
                  }}
                >
                  {group.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </div>
              </div>
              {group.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-prism-bg-primary flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-prism-accent-verified"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-[10px] text-prism-text-dim max-w-[64px] truncate group-hover:text-prism-text-secondary transition-colors">
              {group.name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {selectedGroup && (
        <StoryViewer
          group={selectedGroup}
          storyIndex={storyIndex}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={handleClose}
        />
      )}
    </>
  );
}

interface StoryViewerProps {
  group: StoryGroup;
  storyIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

function StoryViewer({
  group,
  storyIndex,
  onNext,
  onPrev,
  onClose,
}: StoryViewerProps) {
  const story = group.stories[storyIndex];
  if (!story) return null;

  const color = COMMUNITY_COLORS[group.communityType as CommunityType];
  const timeAgo = getTimeAgo(story.created_at);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
        {group.stories.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                i < storyIndex
                  ? "w-full bg-white"
                  : i === storyIndex
                    ? "w-full bg-white animate-story-progress"
                    : "w-0 bg-white"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: color + "30",
              color: color,
            }}
          >
            {group.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-white">
                {group.name}
              </span>
              {group.verified && (
                <svg
                  className="w-3.5 h-3.5 text-prism-accent-verified"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <span className="text-[11px] text-white/50">{timeAgo}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close story"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Story content */}
      <div className="relative max-w-md w-full mx-4">
        <div
          className="rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center"
          style={{
            background: `linear-gradient(135deg, ${color}15, ${color}05)`,
            borderColor: color + "30",
            borderWidth: 1,
          }}
        >
          <p className="text-lg text-white leading-relaxed font-body">
            {story.content}
          </p>

          {story.topic_id && (
            <div className="mt-6">
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  backgroundColor: color + "20",
                  color: color,
                }}
              >
                {story.community?.name ?? "Community"}
              </span>
            </div>
          )}

          {/* Story time remaining */}
          {story.expires_at && (
            <div className="mt-4 flex items-center gap-1.5 text-white/40">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-[11px]">
                {getExpiryText(story.expires_at)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation zones */}
      <button
        onClick={onPrev}
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
        aria-label="Previous story"
      />
      <button
        onClick={onNext}
        className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
        aria-label="Next story"
      />
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function getExpiryText(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}
