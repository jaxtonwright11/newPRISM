"use client";

import { useState } from "react";
import { StoryViewer } from "@/components/story-viewer";

interface Story {
  id: string;
  communityName: string;
  communityType: string;
  color: string;
  preview: string;
  isOwn?: boolean;
  expiresIn: string;
}

const MOCK_STORIES: Story[] = [
  {
    id: "story-own",
    communityName: "Your Story",
    communityType: "civic",
    color: "#4A9EFF",
    preview: "",
    isOwn: true,
    expiresIn: "",
  },
  {
    id: "story-1",
    communityName: "Detroit Auto Workers",
    communityType: "civic",
    color: "#4A9EFF",
    preview: "UAW meeting today — contract talks at Ford River Rouge plant",
    expiresIn: "2h",
  },
  {
    id: "story-2",
    communityName: "Rural Appalachia",
    communityType: "rural",
    color: "#F59E0B",
    preview: "First spring wildflowers spotted on the ridge. Something good.",
    expiresIn: "5h",
  },
  {
    id: "story-3",
    communityName: "Cuban-American Miami",
    communityType: "diaspora",
    color: "#A855F7",
    preview: "Calle Ocho festival preparations underway",
    expiresIn: "8h",
  },
  {
    id: "story-4",
    communityName: "HBCU Student Voices",
    communityType: "academic",
    color: "#06B6D4",
    preview: "Graduating class of 2026 — we made it",
    expiresIn: "12h",
  },
  {
    id: "story-5",
    communityName: "Tribal Nations Midwest",
    communityType: "cultural",
    color: "#F97316",
    preview: "Spring ceremony — honoring the land",
    expiresIn: "14h",
  },
  {
    id: "story-6",
    communityName: "Policy Wonks DC",
    communityType: "policy",
    color: "#10B981",
    preview: "New infrastructure bill markup — reading it now",
    expiresIn: "18h",
  },
];

interface StoriesStripProps {
  onComposeStory?: () => void;
}

export function StoriesStrip({ onComposeStory }: StoriesStripProps) {
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  const handleView = (id: string) => {
    setViewedIds((prev) => new Set(Array.from(prev).concat(id)));
    setActiveStoryId(id);
  };

  const viewableStories = MOCK_STORIES.filter((s) => !s.isOwn);

  const handleNext = () => {
    if (!activeStoryId) return;
    const idx = viewableStories.findIndex((s) => s.id === activeStoryId);
    if (idx < viewableStories.length - 1) {
      const next = viewableStories[idx + 1];
      handleView(next.id);
    } else {
      setActiveStoryId(null);
    }
  };

  const handlePrev = () => {
    if (!activeStoryId) return;
    const idx = viewableStories.findIndex((s) => s.id === activeStoryId);
    if (idx > 0) {
      const prev = viewableStories[idx - 1];
      setActiveStoryId(prev.id);
    }
  };

  const activeStory = viewableStories.find((s) => s.id === activeStoryId) ?? null;

  return (
    <>
    {activeStory && (
      <StoryViewer
        story={activeStory}
        onClose={() => setActiveStoryId(null)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    )}
    <div className="px-3 md:px-4 py-2 border-b border-prism-border">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1">
        {MOCK_STORIES.map((story) => (
          <button
            key={story.id}
            onClick={() => {
              if (story.isOwn) {
                onComposeStory?.();
              } else {
                handleView(story.id);
              }
            }}

            className="flex flex-col items-center gap-1 shrink-0 group"
            aria-label={story.isOwn ? "Add your story" : `View ${story.communityName}'s story`}
          >
            {/* Story ring */}
            <div
              className={`w-12 h-12 rounded-full p-[2px] transition-opacity ${
                story.isOwn
                  ? "border-2 border-dashed border-prism-border"
                  : viewedIds.has(story.id)
                  ? "border-2 border-prism-bg-elevated"
                  : ""
              }`}
              style={
                !story.isOwn && !viewedIds.has(story.id)
                  ? {
                      background: "linear-gradient(135deg, #FF6B8A, #F59E0B)",
                      padding: "2px",
                    }
                  : undefined
              }
            >
              <div className="w-full h-full rounded-full bg-prism-bg-elevated flex items-center justify-center overflow-hidden">
                {story.isOwn ? (
                  <svg
                    className="w-5 h-5 text-prism-text-dim"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                ) : (
                  <span
                    className="text-xs font-bold"
                    style={{ color: story.color }}
                  >
                    {story.communityName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                )}
              </div>
            </div>
            {/* Label */}
            <span
              className={`text-[9px] font-medium w-12 text-center truncate ${
                story.isOwn
                  ? "text-prism-text-dim"
                  : viewedIds.has(story.id)
                  ? "text-prism-text-dim"
                  : "text-prism-text-secondary"
              }`}
            >
              {story.isOwn ? "Your Story" : story.communityName.split(" ")[0]}
            </span>
            {!story.isOwn && (
              <span className="text-[8px] font-mono text-prism-text-dim -mt-0.5">
                {story.expiresIn}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
    </>
  );
}
