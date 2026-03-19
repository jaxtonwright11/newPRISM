"use client";

import { useState, useCallback } from "react";
import { TopicSidebar } from "@/components/topic-sidebar";
import { MapPlaceholder } from "@/components/map-placeholder";
import { PerspectiveCard } from "@/components/perspective-card";
import { AlignmentPanel } from "@/components/alignment-panel";
import { PerspectiveDetail } from "@/components/perspective-detail";
import { MobileNav } from "@/components/mobile-nav";
import {
  SEED_TOPICS,
  SEED_PERSPECTIVES,
  getPerspectivesByTopic,
  getAlignmentsByTopic,
  getTopicBySlug,
} from "@/lib/seed-data";

type FeedTab = "nearby" | "communities" | "discover";

export default function Home() {
  const [activeTab, setActiveTab] = useState<FeedTab>("nearby");
  const [selectedTopicSlug, setSelectedTopicSlug] = useState(
    SEED_TOPICS[0].slug
  );
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<
    string | null
  >(null);
  const [mobileNavTab, setMobileNavTab] = useState<
    "live" | "map" | "search" | "bookmarks" | "profile"
  >("live");
  const [mobileTopicOpen, setMobileTopicOpen] = useState(false);

  const currentTopic = getTopicBySlug(selectedTopicSlug);
  const topicPerspectives = getPerspectivesByTopic(selectedTopicSlug);
  const topicAlignments = currentTopic
    ? getAlignmentsByTopic(currentTopic.id)
    : [];

  const getFeedPerspectives = useCallback(() => {
    switch (activeTab) {
      case "nearby":
        return topicPerspectives;
      case "communities":
        return topicPerspectives.filter(
          (p) =>
            p.community.community_type === "civic" ||
            p.community.community_type === "rural"
        );
      case "discover":
        return topicPerspectives.filter(
          (p) =>
            p.community.community_type !== "civic" &&
            p.community.community_type !== "rural"
        );
      default:
        return topicPerspectives;
    }
  }, [activeTab, topicPerspectives]);

  const feedPerspectives = getFeedPerspectives();

  const selectedPerspective = selectedPerspectiveId
    ? SEED_PERSPECTIVES.find((p) => p.id === selectedPerspectiveId)
    : null;

  const handleTopicSelect = (slug: string) => {
    setSelectedTopicSlug(slug);
    setMobileTopicOpen(false);
  };

  const tabs: { id: FeedTab; label: string; icon?: string }[] = [
    { id: "nearby", label: "Nearby" },
    { id: "communities", label: "Communities" },
    { id: "discover", label: "Discover", icon: "✦" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-prism-bg-primary">
      {/* Desktop sidebar */}
      <TopicSidebar
        selectedTopic={selectedTopicSlug}
        onTopicSelect={handleTopicSelect}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-prism-border bg-prism-bg-secondary/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">
                P
              </span>
            </div>
            <span className="font-display text-base font-bold text-prism-text-primary">
              PRISM
            </span>
          </div>
          <button
            onClick={() => setMobileTopicOpen(!mobileTopicOpen)}
            className="text-sm text-prism-accent-active flex items-center gap-1"
          >
            <span className="truncate max-w-[180px]">
              {currentTopic?.title ?? "Select topic"}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${mobileTopicOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>

        {/* Mobile topic dropdown */}
        {mobileTopicOpen && (
          <div className="md:hidden absolute top-[52px] left-0 right-0 bg-prism-bg-secondary border-b border-prism-border z-30 max-h-[50vh] overflow-y-auto">
            {SEED_TOPICS.filter((t) => t.status !== "archived").map((topic) => (
              <button
                key={topic.slug}
                onClick={() => handleTopicSelect(topic.slug)}
                className={`w-full text-left px-4 py-3 border-b border-prism-border/50 transition-colors ${
                  selectedTopicSlug === topic.slug
                    ? "bg-prism-accent-active/10"
                    : ""
                }`}
              >
                <span className="text-sm font-medium text-prism-text-primary">
                  {topic.title}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-prism-text-dim">
                    {topic.perspective_count} perspectives ·{" "}
                    {topic.community_count} communities
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Map area — 40% viewport */}
        <div className="h-[35vh] md:h-[40vh] p-2 md:p-3">
          <MapPlaceholder />
        </div>

        {/* Feed tabs */}
        <div className="px-3 md:px-4 py-2 border-b border-prism-border flex items-center justify-between">
          <div className="flex gap-1 bg-prism-bg-elevated rounded-full p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 md:px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  activeTab === tab.id
                    ? "bg-prism-accent-active text-white shadow-sm"
                    : "text-prism-text-secondary hover:text-prism-text-primary"
                }`}
              >
                {tab.icon && <span className="mr-1">{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </div>
          {currentTopic && (
            <span className="hidden sm:inline text-xs text-prism-text-dim font-mono">
              {feedPerspectives.length} perspective
              {feedPerspectives.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Perspective cards grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-20 md:pb-4">
          {feedPerspectives.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
              {feedPerspectives.map((p, i) => (
                <PerspectiveCard
                  key={p.id}
                  id={p.id}
                  community={p.community}
                  quote={p.quote}
                  context={p.context}
                  category_tag={p.category_tag}
                  reaction_count={p.reaction_count}
                  bookmark_count={p.bookmark_count}
                  isNew={activeTab === "discover"}
                  onSelect={setSelectedPerspectiveId}
                  animationDelay={i * 50}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-prism-bg-elevated flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-prism-text-dim"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                  />
                </svg>
              </div>
              <p className="text-sm text-prism-text-dim mb-1">
                No perspectives yet
              </p>
              <p className="text-xs text-prism-text-dim/60">
                Try switching to a different tab or topic.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Desktop alignment panel */}
      <AlignmentPanel
        alignments={topicAlignments}
        topicTitle={currentTopic?.title}
      />

      {/* Mobile bottom nav */}
      <MobileNav activeTab={mobileNavTab} onTabChange={setMobileNavTab} />

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
