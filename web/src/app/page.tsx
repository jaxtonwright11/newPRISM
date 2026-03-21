"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { TopicSidebar } from "@/components/topic-sidebar";
import { MapPlaceholder } from "@/components/map-placeholder";
import { PerspectiveCard } from "@/components/perspective-card";
import { PersonalPostCard } from "@/components/personal-post-card";
import { AlignmentPanel } from "@/components/alignment-panel";
import { PerspectiveDetail } from "@/components/perspective-detail";
import { StoriesBar } from "@/components/stories-bar";
import { CommunityPulse } from "@/components/community-pulse";
import { MobileNav } from "@/components/mobile-nav";
import { CreatePostModal } from "@/components/create-post-modal";
import { HeatPerspectivesPanel } from "@/components/heat-perspectives-panel";
import type { HeatPoint } from "@/components/map-placeholder";
import { useGhostMode } from "@/lib/use-ghost-mode";
import type { Post, CommunityType } from "@shared/types";
import {
  SEED_TOPICS,
  SEED_COMMUNITIES,
  SEED_PERSPECTIVES,
  getPerspectivesByTopic,
  getAlignmentsByTopic,
  getTopicBySlug,
  getCommunitiesForTopic,
  getStoryGroups,
  getPostsByTopic,
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
  const [mobileTopicOpen, setMobileTopicOpen] = useState(false);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [heatPanelOpen, setHeatPanelOpen] = useState(false);
  const [selectedHeatPoint, setSelectedHeatPoint] = useState<HeatPoint | null>(null);
  const { ghostMode, toggleGhostMode } = useGhostMode();

  const currentTopic = getTopicBySlug(selectedTopicSlug);
  const topicPerspectives = getPerspectivesByTopic(selectedTopicSlug);
  const topicPosts = getPostsByTopic(selectedTopicSlug);
  const topicAlignments = currentTopic
    ? getAlignmentsByTopic(currentTopic.id)
    : [];
  const topicCommunities = getCommunitiesForTopic(selectedTopicSlug);
  const topicCommunityIds = topicCommunities.map((c) => c.id);
  const storyGroups = getStoryGroups();

  // Generate heat points from seed data (communities with perspectives on same topic)
  const seedHeatPoints = useMemo<HeatPoint[]>(() => {
    const communityMap = new Map<string, { lat: number; lng: number; ids: Set<string>; types: Set<string>; count: number }>();
    for (const p of topicPerspectives) {
      // Look up full community data with lat/lng from SEED_COMMUNITIES
      const fullComm = SEED_COMMUNITIES.find((c) => c.name === p.community.name);
      if (!fullComm?.latitude || !fullComm?.longitude) continue;
      const key = `${Math.round(fullComm.latitude)}_${Math.round(fullComm.longitude)}`;
      if (!communityMap.has(key)) {
        communityMap.set(key, { lat: fullComm.latitude, lng: fullComm.longitude, ids: new Set(), types: new Set(), count: 0 });
      }
      const entry = communityMap.get(key)!;
      if (!entry.ids.has(fullComm.id)) {
        entry.ids.add(fullComm.id);
        entry.types.add(fullComm.community_type);
        entry.count++;
      }
    }
    return Array.from(communityMap.values())
      .filter((e) => e.count >= 2)
      .map((e) => ({
        latitude: e.lat,
        longitude: e.lng,
        intensity: Math.min(e.count / 5, 1),
        community_count: e.count,
        community_types: Array.from(e.types),
        topic_count: 1,
      }));
  }, [topicPerspectives]);

  // Use API heat points if available, otherwise seed
  useEffect(() => {
    async function fetchHeat() {
      try {
        const res = await fetch(`/api/map/heat${currentTopic ? `?topic_id=${currentTopic.id}` : ""}`);
        const { heat_points } = await res.json();
        if (heat_points?.length > 0) {
          setHeatPoints(heat_points);
          return;
        }
      } catch {
        // fall through
      }
      setHeatPoints(seedHeatPoints);
    }
    fetchHeat();
  }, [currentTopic, seedHeatPoints]);

  const handleHeatTap = useCallback((point: HeatPoint) => {
    setSelectedHeatPoint(point);
    setHeatPanelOpen(true);
  }, []);

  // Get perspectives near the selected heat point for the panel
  const heatPerspectives = useMemo(() => {
    if (!selectedHeatPoint) return [];
    return topicPerspectives
      .filter((p) => {
        const fullComm = SEED_COMMUNITIES.find((c) => c.name === p.community.name);
        if (!fullComm?.latitude || !fullComm?.longitude) return false;
        const dLat = Math.abs(fullComm.latitude - selectedHeatPoint.latitude);
        const dLng = Math.abs(fullComm.longitude - selectedHeatPoint.longitude);
        return dLat < 2 && dLng < 2;
      })
      .map((p) => ({
        id: p.id,
        quote: p.quote,
        context: p.context,
        community: {
          name: p.community.name,
          region: p.community.region,
          community_type: p.community.community_type as CommunityType,
          verified: p.community.verified,
        },
      }));
  }, [selectedHeatPoint, topicPerspectives]);

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
          <div className="flex items-center gap-2">
            {/* Ghost mode toggle */}
            <button
              onClick={toggleGhostMode}
              className={`p-2 rounded-lg transition-colors ${
                ghostMode
                  ? "text-prism-accent-active bg-prism-accent-active/10"
                  : "text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated"
              }`}
              aria-label={`Ghost mode ${ghostMode ? "on" : "off"}`}
              title={ghostMode ? "Ghost mode on" : "Visible mode"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.7}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3l18 18M10.73 5.08A10.477 10.477 0 0112 5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M9.88 9.88a3 3 0 104.24 4.24"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498A10.523 10.523 0 0112 19.5a10.45 10.45 0 01-5.772-1.728M3 3l18 18"
                />
              </svg>
            </button>
            {/* Pulse bell */}
            <button
              onClick={() => setPulseOpen(true)}
              className="relative p-2 rounded-lg text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated transition-colors"
              aria-label="Community Pulse"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-prism-accent-live animate-pulse-slow" />
            </button>
            {/* Topic selector */}
            <button
              onClick={() => setMobileTopicOpen(!mobileTopicOpen)}
              className="text-sm text-prism-accent-active flex items-center gap-1"
            >
              <span className="truncate max-w-[140px]">
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
          <MapPlaceholder
            highlightedCommunityIds={topicCommunityIds}
            ghostMode={ghostMode}
            userPosts={userPosts}
            heatPoints={heatPoints}
            onHeatTap={handleHeatTap}
          />
        </div>

        {/* Stories bar */}
        <div className="border-b border-prism-border">
          <StoriesBar storyGroups={storyGroups} />
        </div>

        {/* Feed tabs + pulse bell (desktop) */}
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
          <div className="flex items-center gap-2">
            {currentTopic && (
              <span className="hidden sm:inline text-xs text-prism-text-dim font-mono">
                {feedPerspectives.length + topicPosts.length} items
              </span>
            )}
            {/* Desktop ghost mode toggle */}
            <button
              onClick={toggleGhostMode}
              className={`hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                ghostMode
                  ? "bg-prism-accent-active/10 text-prism-accent-active"
                  : "text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated"
              }`}
              aria-label={`Ghost mode ${ghostMode ? "on" : "off"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  ghostMode ? "bg-prism-accent-active" : "bg-prism-text-dim"
                }`}
              />
              Ghost
            </button>
            {/* Desktop pulse bell */}
            <button
              onClick={() => setPulseOpen(true)}
              className="hidden md:flex relative p-1.5 rounded-lg text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated transition-colors"
              aria-label="Community Pulse"
            >
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-prism-accent-live animate-pulse-slow" />
            </button>
          </div>
        </div>

        {/* Feed: perspectives + personal posts */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-20 md:pb-4">
          {feedPerspectives.length > 0 || topicPosts.length > 0 ? (
            <div
              key={`${activeTab}-${selectedTopicSlug}`}
              className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 animate-fade-in"
            >
              {/* Interleave perspectives and personal posts */}
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
              {[...userPosts, ...topicPosts].map((post, i) => (
                <PersonalPostCard
                  key={post.id}
                  post={post}
                  animationDelay={(feedPerspectives.length + i) * 50}
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
      <MobileNav />

      {/* Community Pulse panel */}
      <CommunityPulse isOpen={pulseOpen} onClose={() => setPulseOpen(false)} />

      {/* Compose FAB */}
      <button
        onClick={() => setComposeOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-12 h-12 rounded-full bg-prism-accent-active text-white shadow-lg shadow-prism-accent-active/30 hover:bg-prism-accent-active/90 transition-all flex items-center justify-center hover:scale-105 active:scale-95"
        aria-label="Create post"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Heat perspectives panel */}
      <HeatPerspectivesPanel
        open={heatPanelOpen}
        onClose={() => setHeatPanelOpen(false)}
        communityCount={selectedHeatPoint?.community_count ?? 0}
        perspectives={heatPerspectives}
      />

      {/* Create post modal */}
      <CreatePostModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        topicId={currentTopic?.id}
        onPostCreated={(post) => {
          setUserPosts((prev) => [{
            ...post,
            user_id: "",
            community_id: null,
            topic_id: currentTopic?.id ?? null,
            image_url: null,
            expires_at: post.post_type === "story"
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              : null,
            like_count: 0,
            comment_count: 0,
            share_count: 0,
          }, ...prev]);
        }}
      />

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
