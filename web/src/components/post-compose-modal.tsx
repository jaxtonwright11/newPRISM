"use client";

import { useState } from "react";
import type { RadiusMiles } from "@shared/types";

type PostMode = "story" | "permanent";

interface PostComposeModalProps {
  onClose: () => void;
}

const RADIUS_OPTIONS: RadiusMiles[] = [10, 20, 30, 40];

export function PostComposeModal({ onClose }: PostComposeModalProps) {
  const [mode, setMode] = useState<PostMode>("story");
  const [content, setContent] = useState("");
  const [radius, setRadius] = useState<RadiusMiles>(40);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const maxChars = mode === "story" ? 280 : 1000;
  const remaining = maxChars - content.length;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-prism-bg-secondary border border-prism-border rounded-2xl w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-prism-accent-verified/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-prism-accent-verified"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <p className="font-display text-lg font-bold text-prism-text-primary mb-1">
            {mode === "story" ? "Story posted!" : "Post shared!"}
          </p>
          <p className="text-sm text-prism-text-secondary">
            {mode === "story"
              ? "Your story is live on the map for 24 hours."
              : "Your post is visible to your community."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative bg-prism-bg-secondary border border-prism-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-prism-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-prism-border">
          <h2 className="font-display text-base font-bold text-prism-text-primary">
            Share from your community
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-prism-bg-elevated text-prism-text-dim hover:text-prism-text-primary transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
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

        <div className="p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {(["story", "permanent"] as PostMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-prism-accent-active text-white"
                    : "bg-prism-bg-elevated text-prism-text-secondary hover:text-prism-text-primary"
                }`}
              >
                {m === "story" ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Story
                    <span className="text-xs opacity-70">24hr</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                      />
                    </svg>
                    Post
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Description */}
          <p className="text-xs text-prism-text-dim">
            {mode === "story"
              ? "What's happening in your 40-mile world right now? Disappears in 24 hours."
              : "Share a longer perspective from your community. Permanent post visible on the map."}
          </p>

          {/* Content input */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
              placeholder={
                mode === "story"
                  ? "What's happening around you right now?"
                  : "Share a perspective from your community..."
              }
              rows={mode === "story" ? 4 : 6}
              className="w-full px-3 py-3 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-active resize-none"
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs font-mono ${
                  remaining < 20 ? "text-prism-accent-live" : "text-prism-text-dim"
                }`}
              >
                {remaining}
              </span>
            </div>
          </div>

          {/* Radius selector */}
          <div>
            <p className="text-xs font-medium text-prism-text-secondary mb-2">
              Visible radius
            </p>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    radius === r
                      ? "bg-prism-accent-active/20 text-prism-accent-active border border-prism-accent-active/40"
                      : "bg-prism-bg-elevated text-prism-text-dim hover:text-prism-text-secondary border border-transparent"
                  }`}
                >
                  {r}mi
                </button>
              ))}
            </div>
            <p className="text-[10px] text-prism-text-dim mt-1.5">
              Exact location is never shared. Only your {radius}-mile radius appears on the map.
            </p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="w-full py-3 rounded-xl bg-prism-accent-active text-white text-sm font-medium hover:bg-prism-accent-active/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Posting..."
              : mode === "story"
              ? "Share Story"
              : "Publish Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
