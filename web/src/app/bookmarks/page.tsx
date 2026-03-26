"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PerspectiveCard } from "@/components/perspective-card";
import { PerspectiveDetail } from "@/components/perspective-detail";
import { EmptyState as SharedEmptyState, EMPTY_STATES } from "@/components/empty-state";
import type { CommunityType } from "@shared/types";

type BookmarkTab = "perspectives" | "topics";

interface BookmarkedPerspective {
  id: string;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
  quote: string;
  context: string | null;
  category_tag: string | null;
  reaction_count: number;
  bookmark_count: number;
  created_at?: string;
}

interface BookmarkedTopic {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  perspective_count: number;
  community_count: number;
}

export default function BookmarksPage() {
  const [activeTab, setActiveTab] = useState<BookmarkTab>("perspectives");
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);
  const { session } = useAuth();

  const [bookmarkedPerspectives, setBookmarkedPerspectives] = useState<BookmarkedPerspective[]>([]);
  const [bookmarkedTopics, setBookmarkedTopics] = useState<BookmarkedTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        const [perspRes, topicRes] = await Promise.all([
          fetch("/api/bookmarks/perspectives", { headers }),
          fetch("/api/bookmarks/topics", { headers }),
        ]);
        const perspData = await perspRes.json();
        const topicData = await topicRes.json();
        setBookmarkedPerspectives(perspData.perspectives ?? []);
        setBookmarkedTopics(topicData.topics ?? []);
      } catch {
        // API unavailable — show empty
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, [session?.access_token]);

  const selectedPerspective = selectedPerspectiveId
    ? bookmarkedPerspectives.find((p) => p.id === selectedPerspectiveId)
    : null;

  const tabs: { id: BookmarkTab; label: string; count: number }[] = [
    { id: "perspectives", label: "Perspectives", count: bookmarkedPerspectives.length },
    { id: "topics", label: "Topics", count: bookmarkedTopics.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-base">
        <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-base font-semibold text-prism-text-primary">Saved</h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-prism-bg-elevated rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-prism-bg-base">
      {/* Header */}
      <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-prism-text-primary">Saved</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-prism-bg-elevated rounded-full p-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-prism-accent-primary text-white shadow-sm"
                  : "text-prism-text-secondary hover:text-prism-text-primary"
              }`}
            >
              {tab.label}
              <span className="font-mono text-xs opacity-70">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Bookmarked perspectives */}
        {activeTab === "perspectives" && (
          <div className="space-y-3">
            {bookmarkedPerspectives.length > 0 ? (
              bookmarkedPerspectives.map((p, i) => (
                <PerspectiveCard
                  key={p.id}
                  id={p.id}
                  community={p.community}
                  quote={p.quote}
                  context={p.context}
                  category_tag={p.category_tag}
                  reaction_count={p.reaction_count}
                  bookmark_count={p.bookmark_count}
                  onSelect={setSelectedPerspectiveId}
                  animationDelay={i * 50}
                />
              ))
            ) : (
              <SharedEmptyState {...EMPTY_STATES.bookmarksPerspectives} />
            )}
          </div>
        )}

        {/* Bookmarked topics */}
        {activeTab === "topics" && (
          <div className="space-y-2">
            {bookmarkedTopics.length > 0 ? (
              bookmarkedTopics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topic/${topic.slug}`}
                  className="block bg-prism-bg-surface rounded-xl border border-prism-border p-4 hover:bg-prism-bg-elevated transition-colors"
                >
                  <h2 className="text-sm font-medium text-prism-text-primary mb-1">{topic.title}</h2>
                  {topic.summary && (
                    <p className="text-xs text-prism-text-secondary line-clamp-2 mb-2">{topic.summary}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-prism-text-dim">
                      {topic.perspective_count} perspectives · {topic.community_count} communities
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <SharedEmptyState {...EMPTY_STATES.bookmarksTopics} />
            )}
          </div>
        )}
      </div>

      {/* Perspective detail modal */}
      {selectedPerspective && (
        <PerspectiveDetail
          id={selectedPerspective.id}
          community={selectedPerspective.community}
          quote={selectedPerspective.quote}
          context={selectedPerspective.context}
          category_tag={selectedPerspective.category_tag}
          reaction_count={selectedPerspective.reaction_count}
          bookmark_count={selectedPerspective.bookmark_count}
          created_at={selectedPerspective.created_at}
          onClose={() => setSelectedPerspectiveId(null)}
        />
      )}
    </div>
  );
}

