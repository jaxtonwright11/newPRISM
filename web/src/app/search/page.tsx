"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PerspectiveCard } from "@/components/perspective-card";
import { PerspectiveDetail } from "@/components/perspective-detail";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType, Community, Topic } from "@shared/types";

type SearchTab = "all" | "perspectives" | "topics" | "communities";

interface SearchPerspective {
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null);
  const { session } = useAuth();

  const [perspectives, setPerspectives] = useState<SearchPerspective[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setPerspectives([]);
      setTopics([]);
      setCommunities([]);
      return;
    }
    setSearching(true);
    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { headers });
      const data = await res.json();
      setPerspectives(data.perspectives ?? []);
      setTopics(data.topics ?? []);
      setCommunities(data.communities ?? []);
    } catch {
      // API unavailable
    } finally {
      setSearching(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const totalResults = perspectives.length + topics.length + communities.length;

  const selectedPerspective = selectedPerspectiveId
    ? perspectives.find((p) => p.id === selectedPerspectiveId)
    : null;

  const tabs: { id: SearchTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalResults },
    { id: "perspectives", label: "Perspectives", count: perspectives.length },
    { id: "topics", label: "Topics", count: topics.length },
    { id: "communities", label: "Communities", count: communities.length },
  ];

  const showPerspectives = activeTab === "all" || activeTab === "perspectives";
  const showTopics = activeTab === "all" || activeTab === "topics";
  const showCommunities = activeTab === "all" || activeTab === "communities";

  return (
    <div className="min-h-screen bg-prism-bg-base">
      {/* Header */}
      <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-prism-text-dim hover:text-prism-text-primary transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="sr-only">Search</h1>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search perspectives, topics, communities..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-primary transition-shadow"
              />
              {query.length > 0 && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-prism-text-dim hover:text-prism-text-primary"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {query.length >= 2 && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                    activeTab === tab.id
                      ? "bg-prism-accent-primary text-white"
                      : "bg-prism-bg-elevated text-prism-text-secondary hover:text-prism-text-primary"
                  }`}
                >
                  {tab.label}
                  <span className="font-mono text-[10px] opacity-70">{tab.count}</span>
                </button>
              ))}
            </div>

            {searching && (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-prism-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}

            {!searching && totalResults === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-prism-text-dim">No results found for &quot;{query}&quot;</p>
                <p className="text-xs text-prism-text-dim/60 mt-1">Try different keywords or browse topics from the home page.</p>
              </div>
            )}

            {/* Communities results */}
            {!searching && showCommunities && communities.length > 0 && (
              <div className="mb-6">
                {activeTab === "all" && (
                  <h2 className="text-xs font-semibold text-prism-text-dim uppercase tracking-wider mb-2">Communities</h2>
                )}
                <div className="space-y-2">
                  {communities.map((community) => (
                    <Link
                      key={community.id}
                      href={`/community/${community.id}`}
                      className="flex items-center gap-3 bg-prism-bg-surface rounded-xl border border-prism-border p-3 hover:bg-prism-bg-elevated transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          backgroundColor: COMMUNITY_COLORS[community.community_type as CommunityType] + "20",
                          color: COMMUNITY_COLORS[community.community_type as CommunityType],
                        }}
                      >
                        {community.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-prism-text-primary truncate block">{community.name}</span>
                        <span className="text-xs text-prism-text-dim">{community.region}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Topics results */}
            {!searching && showTopics && topics.length > 0 && (
              <div className="mb-6">
                {activeTab === "all" && (
                  <h2 className="text-xs font-semibold text-prism-text-dim uppercase tracking-wider mb-2">Topics</h2>
                )}
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/topic/${topic.slug}`}
                      className="block bg-prism-bg-surface rounded-xl border border-prism-border p-3 hover:bg-prism-bg-elevated transition-colors"
                    >
                      <h3 className="text-sm font-medium text-prism-text-primary">{topic.title}</h3>
                      {topic.summary && (
                        <p className="text-xs text-prism-text-secondary line-clamp-2 mt-1">{topic.summary}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Perspectives results */}
            {!searching && showPerspectives && perspectives.length > 0 && (
              <div className="mb-6">
                {activeTab === "all" && (
                  <h2 className="text-xs font-semibold text-prism-text-dim uppercase tracking-wider mb-2">Perspectives</h2>
                )}
                <div className="space-y-3">
                  {perspectives.map((p, i) => (
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
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {query.length < 2 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-prism-bg-elevated flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-sm text-prism-text-dim mb-1">Search across PRISM</p>
            <p className="text-xs text-prism-text-dim/60">Find perspectives, topics, and communities.</p>
          </div>
        )}
      </div>

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
