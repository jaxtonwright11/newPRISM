"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { PerspectiveCard } from "@/components/perspective-card";
import { FeedSkeleton } from "@/components/skeleton";
import { PrismWordmark } from "@/components/prism-wordmark";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/use-realtime";
import { recordPost } from "@/lib/streak";
import type { CommunityType } from "@shared/types";

const PerspectiveDetail = dynamic(
  () => import("@/components/perspective-detail").then((mod) => mod.PerspectiveDetail),
  { ssr: false }
);

type FeedTab = "nearby" | "communities";

interface DisplayPerspective {
  id: string;
  quote: string;
  context: string | null;
  category_tag: string | null;
  reaction_count: number;
  bookmark_count: number;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("nearby");
  const [feedPerspectives, setFeedPerspectives] = useState<DisplayPerspective[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    async function fetchFeed() {
      setFeedLoading(true);
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      try {
        const res = await fetch(`/api/feed/${activeTab}`, { headers });
        const json = await res.json();
        const perspectives = activeTab === "nearby"
          ? (json.data?.perspectives ?? json.data ?? [])
          : (json.data ?? []);
        setFeedPerspectives(perspectives);
      } catch {
        setFeedPerspectives([]);
      } finally {
        setFeedLoading(false);
      }
    }
    fetchFeed();
  }, [activeTab, session?.access_token]);

  useRealtime({
    table: "perspectives",
    event: "INSERT",
    onInsert: useCallback((payload: Record<string, unknown>) => {
      if (payload.quote && payload.id) {
        setFeedPerspectives((prev) => {
          if (prev.some((p) => p.id === payload.id)) return prev;
          return [payload as unknown as DisplayPerspective, ...prev];
        });
      }
    }, []),
    enabled: !!session,
  });

  const selectedPerspective = selectedPerspectiveId
    ? feedPerspectives.find((p) => p.id === selectedPerspectiveId)
    : null;

  const tabs: { id: FeedTab; label: string }[] = [
    { id: "nearby", label: "Nearby" },
    { id: "communities", label: "Communities" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--bg-elevated)]">
        <PrismWordmark size="sm" />
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-full p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium font-body transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {feedLoading ? (
          <FeedSkeleton count={4} />
        ) : feedPerspectives.length > 0 ? (
          <div className="flex flex-col gap-2 animate-fade-in">
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
                isNew={false}
                onSelect={setSelectedPerspectiveId}
                animationDelay={i * 50}
              />
            ))}
          </div>
        ) : (
          <EmptyState {...EMPTY_STATES.feed} />
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
          onClose={() => setSelectedPerspectiveId(null)}
        />
      )}
    </div>
  );
}
