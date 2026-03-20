"use client";

import Link from "next/link";
import { useState } from "react";
import { SEED_PERSPECTIVES } from "@/lib/seed-data";
import type { CommunityType } from "@shared/types";
import { COMMUNITY_COLORS } from "@/lib/constants";

// Pre-seed a few bookmarks for demo
const INITIAL_BOOKMARKS = ["persp-8", "persp-11", "persp-14", "persp-1"];

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(
    new Set(INITIAL_BOOKMARKS)
  );

  const bookmarkedPerspectives = SEED_PERSPECTIVES.filter((p) =>
    bookmarks.has(p.id)
  );

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-prism-bg-primary">
      {/* Header */}
      <header className="bg-prism-bg-secondary border-b border-prism-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-prism-text-dim hover:text-prism-text-primary transition-colors"
            aria-label="Back"
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </Link>
          <div>
            <h1 className="font-display text-base font-bold text-prism-text-primary">
              Saved
            </h1>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-mono text-prism-text-dim">
              {bookmarkedPerspectives.length} saved
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {bookmarkedPerspectives.length > 0 ? (
          <div className="space-y-3">
            {bookmarkedPerspectives.map((p) => {
              const color = COMMUNITY_COLORS[p.community.community_type as CommunityType] ?? p.community.color_hex;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-prism-border bg-prism-bg-secondary p-4 group relative"
                  style={{ borderLeftWidth: "3px", borderLeftColor: p.community.color_hex }}
                >
                  {/* Remove bookmark */}
                  <button
                    onClick={() => removeBookmark(p.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-prism-accent-active hover:bg-prism-bg-elevated transition-colors"
                    aria-label="Remove bookmark"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  </button>

                  {/* Community header */}
                  <div className="flex items-center gap-2 mb-3 pr-8">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: color + "20",
                        color,
                      }}
                    >
                      {p.community.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-prism-text-primary">
                        {p.community.name}
                      </p>
                      <p className="text-[10px] text-prism-text-dim">
                        {p.community.region}
                      </p>
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="font-display italic text-sm leading-relaxed text-prism-text-primary mb-3">
                    &ldquo;{p.quote}&rdquo;
                  </blockquote>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-prism-bg-elevated text-prism-text-dim">
                      {p.category_tag}
                    </span>
                    <Link
                      href={`/topic/${p.topic_slug}`}
                      className="text-[10px] text-prism-accent-active hover:underline"
                    >
                      See topic →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-prism-bg-elevated flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7 text-prism-text-dim"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-prism-text-primary mb-1">
              No saved perspectives
            </p>
            <p className="text-xs text-prism-text-dim mb-6">
              Bookmark perspectives from the feed to save them here.
            </p>
            <Link
              href="/"
              className="text-sm text-prism-accent-active hover:underline"
            >
              Browse perspectives
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
