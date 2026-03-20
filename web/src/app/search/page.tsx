"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SEED_TOPICS, SEED_COMMUNITIES, SEED_PERSPECTIVES } from "@/lib/seed-data";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

type SearchType = "all" | "topics" | "communities" | "perspectives";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("all");

  const q = query.toLowerCase().trim();

  const matchedTopics = useMemo(() => {
    if (type !== "all" && type !== "topics") return [];
    if (!q) return SEED_TOPICS.filter((t) => t.status !== "archived");
    return SEED_TOPICS.filter(
      (t) =>
        t.status !== "archived" &&
        (t.title.toLowerCase().includes(q) || t.summary?.toLowerCase().includes(q))
    );
  }, [q, type]);

  const matchedCommunities = useMemo(() => {
    if (type !== "all" && type !== "communities") return [];
    if (!q) return SEED_COMMUNITIES.filter((c) => c.active);
    return SEED_COMMUNITIES.filter(
      (c) =>
        c.active &&
        (c.name.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q) ||
          c.community_type.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q))
    );
  }, [q, type]);

  const matchedPerspectives = useMemo(() => {
    if (type !== "all" && type !== "perspectives") return [];
    if (!q) return [];
    return SEED_PERSPECTIVES.filter(
      (p) =>
        p.quote.toLowerCase().includes(q) ||
        p.context.toLowerCase().includes(q) ||
        p.community.name.toLowerCase().includes(q) ||
        p.category_tag.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [q, type]);

  const hasResults =
    matchedTopics.length > 0 ||
    matchedCommunities.length > 0 ||
    matchedPerspectives.length > 0;

  return (
    <div className="min-h-screen bg-prism-bg-primary">
      {/* Header */}
      <header className="bg-prism-bg-secondary border-b border-prism-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-prism-text-dim hover:text-prism-text-primary transition-colors shrink-0"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>

          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-prism-text-dim"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search topics, communities, perspectives..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-active"
            />
          </div>
        </div>

        {/* Type filters */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {(["all", "topics", "communities", "perspectives"] as SearchType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                type === t
                  ? "bg-prism-accent-active text-white"
                  : "bg-prism-bg-elevated text-prism-text-dim hover:text-prism-text-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-6">
        {/* Topics */}
        {matchedTopics.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-3">
              Topics
            </h2>
            <div className="space-y-2">
              {matchedTopics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/topic/${topic.slug}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-prism-bg-secondary border border-prism-border hover:border-prism-accent-active/30 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-prism-text-primary group-hover:text-prism-accent-active transition-colors">
                      {topic.title}
                    </p>
                    {topic.summary && (
                      <p className="text-xs text-prism-text-dim mt-0.5 line-clamp-1">
                        {topic.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          topic.status === "hot"
                            ? "bg-prism-accent-live/20 text-prism-accent-live"
                            : topic.status === "trending"
                            ? "bg-prism-accent-active/20 text-prism-accent-active"
                            : "bg-prism-accent-verified/20 text-prism-accent-verified"
                        }`}
                      >
                        {topic.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-prism-text-dim">
                        {topic.perspective_count} perspectives
                      </span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-prism-text-dim shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Communities */}
        {matchedCommunities.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-3">
              Communities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matchedCommunities.map((community) => {
                const color = COMMUNITY_COLORS[community.community_type as CommunityType];
                return (
                  <Link
                    key={community.id}
                    href={`/community/${community.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-prism-bg-secondary border border-prism-border hover:border-prism-accent-active/30 transition-colors group"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      {community.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-prism-text-primary truncate group-hover:text-prism-accent-active transition-colors">
                        {community.name}
                      </p>
                      <p className="text-xs text-prism-text-dim truncate">{community.region}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Perspectives */}
        {matchedPerspectives.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-3">
              Perspectives
            </h2>
            <div className="space-y-2">
              {matchedPerspectives.map((p) => (
                <Link
                  key={p.id}
                  href={`/topic/${p.topic_slug}`}
                  className="block p-4 rounded-xl bg-prism-bg-secondary border border-prism-border hover:border-prism-accent-active/30 transition-colors"
                  style={{ borderLeftWidth: "3px", borderLeftColor: p.community.color_hex }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-medium" style={{ color: p.community.color_hex }}>
                      {p.community.name}
                    </span>
                    <span className="text-[10px] text-prism-text-dim">· {p.category_tag}</span>
                  </div>
                  <p className="font-display italic text-sm leading-relaxed text-prism-text-primary line-clamp-2">
                    &ldquo;{p.quote}&rdquo;
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasResults && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {q ? (
              <>
                <div className="w-12 h-12 rounded-full bg-prism-bg-elevated flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm text-prism-text-dim">No results for &ldquo;{q}&rdquo;</p>
                <p className="text-xs text-prism-text-dim/60 mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <p className="text-sm text-prism-text-dim mb-4">Search across PRISM</p>
                <div className="space-y-2 w-full max-w-xs">
                  <p className="text-xs text-prism-text-dim/70 text-center">Try searching for:</p>
                  {["Border policy", "Electric vehicles", "Climate", "Detroit", "Appalachia"].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="w-full py-2 px-4 rounded-lg bg-prism-bg-elevated text-sm text-prism-text-secondary hover:text-prism-text-primary hover:bg-prism-bg-elevated/80 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
