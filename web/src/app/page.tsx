"use client";

import { useState } from "react";
import { TopicSidebar } from "@/components/topic-sidebar";
import { MapPlaceholder } from "@/components/map-placeholder";
import { PerspectiveCard } from "@/components/perspective-card";
import { AlignmentPanel } from "@/components/alignment-panel";
import { SEED_PERSPECTIVES } from "@/lib/constants";

type FeedTab = "nearby" | "communities" | "discover";

export default function Home() {
  const [activeTab, setActiveTab] = useState<FeedTab>("nearby");
  const [selectedTopic, setSelectedTopic] = useState("us-mexico-border-policy");

  const tabs: { id: FeedTab; label: string; icon?: string }[] = [
    { id: "nearby", label: "Nearby" },
    { id: "communities", label: "Communities" },
    { id: "discover", label: "Discover", icon: "✦" },
  ];

  const filteredPerspectives = SEED_PERSPECTIVES.filter((p) => {
    if (selectedTopic === "us-mexico-border-policy") {
      return p.topic === "US-Mexico Border Policy Changes";
    }
    if (selectedTopic === "remote-work-rural") {
      return p.topic === "Remote Work and Rural Economies";
    }
    return true;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <TopicSidebar onTopicSelect={setSelectedTopic} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Map area - 40% viewport */}
        <div className="h-[40vh] p-3">
          <MapPlaceholder />
        </div>

        {/* Feed tabs */}
        <div className="px-4 py-2 border-b border-prism-border">
          <div className="flex gap-1 bg-prism-bg-elevated rounded-full p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-prism-accent-active text-white"
                    : "text-prism-text-secondary hover:text-prism-text-primary"
                }`}
              >
                {tab.icon && <span className="mr-1">{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Perspective cards grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPerspectives.length > 0 ? (
              filteredPerspectives.map((p) => (
                <PerspectiveCard
                  key={p.id}
                  community={p.community}
                  quote={p.quote}
                  context={p.context}
                  category_tag={p.category_tag}
                  reaction_count={p.reaction_count}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-12">
                <p className="text-prism-text-dim text-sm">
                  No perspectives found for this topic yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AlignmentPanel />
    </div>
  );
}
