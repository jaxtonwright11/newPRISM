"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import { prismEvents } from "@/lib/posthog";
import type { Community, Topic } from "@shared/types";
import type { CommunitySentiment } from "@shared/map-sentiment";

const MapPlaceholder = dynamic(
  () => import("@/components/map-placeholder").then((mod) => mod.MapPlaceholder),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-prism-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-48 h-2 bg-prism-bg-elevated rounded-full overflow-hidden">
            <div className="h-full bg-prism-accent-primary/30 rounded-full animate-shimmer" style={{ width: "60%" }} />
          </div>
          <span className="text-[10px] text-prism-text-dim">Loading map</span>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [sentimentData, setSentimentData] = useState<CommunitySentiment[]>([]);
  const [geoLensActive, setGeoLensActive] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => setCommunities(data.communities ?? data ?? []))
      .catch(() => {});
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        const t = data.topics ?? [];
        setTopics(t);
        const hot = t.find((topic: Topic) => topic.status === "hot");
        const trending = t.find((topic: Topic) => topic.status === "trending");
        setActiveTopic(hot ?? trending ?? t[0] ?? null);
      })
      .catch(() => {});
  }, []);

  // Fetch sentiment data when a topic is selected for map view
  const fetchSentiment = useCallback(async (topicId: string) => {
    try {
      const res = await fetch(`/api/map/sentiment?topic_id=${topicId}`);
      const data = await res.json();
      setSentimentData(data.sentiments ?? []);
    } catch {
      setSentimentData([]);
    }
  }, []);

  useEffect(() => {
    if (selectedTopicId) {
      fetchSentiment(selectedTopicId);
    } else {
      setSentimentData([]);
    }
  }, [selectedTopicId, fetchSentiment]);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) ?? null;

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] md:h-screen relative">
      <MapPlaceholder
        communities={communities}
        isAuthenticated={!!session}
        sentimentData={sentimentData}
        geoLensActive={geoLensActive}
        activeTopicName={selectedTopic?.title}
      />

      {/* Cold-start overlay — when no communities or topics exist yet */}
      {communities.length === 0 && topics.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-prism-bg-surface/95 backdrop-blur-md rounded-2xl border border-prism-border p-6 shadow-lg shadow-black/30 max-w-xs text-center pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-prism-accent-primary/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-prism-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <p className="text-sm font-medium text-prism-text-primary mb-1">
              The map comes alive with communities
            </p>
            <p className="text-xs text-prism-text-dim mb-4">
              As communities share perspectives, their voices light up the map. Explore what&apos;s happening now on Discover.
            </p>
            <Link
              href="/discover"
              className="inline-block px-5 py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-glow transition-colors"
            >
              Explore perspectives
            </Link>
          </div>
        </div>
      )}

      {/* Active Now overlay — only when no topic is selected for lens */}
      {activeTopic && !selectedTopicId && (
        <Link
          href={`/topic/${activeTopic.slug}`}
          className="absolute top-4 left-4 right-4 z-20 max-w-sm"
          onClick={() => prismEvents.mapTopicSelected(activeTopic.title, communities.length)}
        >
          <div className="bg-prism-bg-surface/95 backdrop-blur-md rounded-xl border border-prism-border p-3 shadow-lg shadow-black/30 hover:bg-prism-bg-elevated/95 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-prism-accent-live opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-prism-accent-live" />
              </span>
              <span className="text-[10px] font-semibold text-prism-accent-live uppercase tracking-wider">
                Active Now
              </span>
            </div>
            <p className="text-sm font-medium text-prism-text-primary">{activeTopic.title}</p>
            {activeTopic.summary && (
              <p className="text-xs text-prism-text-dim mt-0.5 line-clamp-1">{activeTopic.summary}</p>
            )}
            <p className="text-[10px] text-prism-accent-primary mt-1.5">
              Tap to see how communities are experiencing this →
            </p>
          </div>
        </Link>
      )}

      {/* Topic selector bar */}
      <div className="absolute bottom-20 md:bottom-6 left-3 right-3 z-20">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {topics.slice(0, 8).map((topic) => {
            const isSelected = selectedTopicId === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedTopicId(null);
                    setGeoLensActive(false);
                  } else {
                    setSelectedTopicId(topic.id);
                    prismEvents.mapTopicSelected(topic.title, communities.length);
                  }
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
                  isSelected
                    ? "bg-prism-accent-primary/20 text-prism-accent-primary border-prism-accent-primary/40"
                    : "bg-prism-bg-surface/90 text-prism-text-secondary border-prism-border/60 hover:bg-prism-bg-elevated/90"
                } backdrop-blur-sm`}
              >
                {topic.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Geographic Lens toggle + topic info — visible when a topic is selected */}
      {selectedTopic && (
        <div className="absolute top-4 left-4 right-4 z-20 max-w-sm">
          <div className="bg-prism-bg-surface/95 backdrop-blur-md rounded-xl border border-prism-border p-3 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-prism-accent-primary" />
                <span className="text-[10px] font-semibold text-prism-accent-primary uppercase tracking-wider">
                  Geographic Lens
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedTopicId(null);
                  setGeoLensActive(false);
                }}
                className="text-prism-text-dim hover:text-prism-text-primary transition-colors p-1"
                aria-label="Close lens"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm font-medium text-prism-text-primary">{selectedTopic.title}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-prism-text-dim font-mono">
                {sentimentData.length} communities responding
              </span>
              <button
                onClick={() => setGeoLensActive(!geoLensActive)}
                className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full transition-all border ${
                  geoLensActive
                    ? "bg-prism-accent-primary/15 text-prism-accent-primary border-prism-accent-primary/30"
                    : "text-prism-text-dim border-prism-border hover:text-prism-text-secondary"
                }`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                Heat overlay {geoLensActive ? "on" : "off"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
