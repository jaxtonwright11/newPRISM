"use client";

import { useState, useEffect } from "react";

interface Story {
  id: string;
  communityName: string;
  communityType: string;
  color: string;
  preview: string;
  expiresIn: string;
  topic?: string;
}

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function StoryViewer({ story, onClose, onNext, onPrev }: StoryViewerProps) {
  const [progress, setProgress] = useState(0);
  const DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        onNext?.();
        if (!onNext) onClose();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [story.id, onClose, onNext]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black"
      onClick={onClose}
    >
      {/* Background with community color */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 40%, ${story.color}40 0%, #000 70%)`,
        }}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3">
        <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 z-10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: story.color + "30", color: story.color, border: `2px solid ${story.color}` }}
          >
            {story.communityName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{story.communityName}</p>
            {story.topic && (
              <p className="text-xs text-white/60">{story.topic}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white"
          aria-label="Close story"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div
        className="relative z-10 max-w-sm w-full px-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-2xl italic leading-relaxed text-white">
          &ldquo;{story.preview}&rdquo;
        </p>
        <p className="text-sm text-white/60 mt-4">
          {story.communityName} · {story.expiresIn} remaining
        </p>
      </div>

      {/* Tap areas for prev/next */}
      <div className="absolute inset-0 z-10 flex">
        <div
          className="flex-1"
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
        />
        <div
          className="flex-1"
          onClick={(e) => { e.stopPropagation(); onNext?.(); if (!onNext) onClose(); }}
        />
      </div>
    </div>
  );
}
