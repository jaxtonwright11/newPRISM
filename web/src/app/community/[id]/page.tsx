import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCommunityById,
  SEED_PERSPECTIVES,
  SEED_TOPICS,
} from "@/lib/seed-data";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return [];
}

export default function CommunityPage({ params }: PageProps) {
  const community = getCommunityById(params.id);
  if (!community) notFound();

  const communityPerspectives = SEED_PERSPECTIVES.filter(
    (p) => p.community_id === community.id
  );

  const topicIds = Array.from(new Set(communityPerspectives.map((p) => p.topic_slug)));
  const activeTopics = SEED_TOPICS.filter((t) => topicIds.includes(t.slug));

  const color = COMMUNITY_COLORS[community.community_type as CommunityType];

  const TYPE_LABELS: Record<CommunityType, string> = {
    civic: "Civic",
    diaspora: "Diaspora",
    rural: "Rural",
    policy: "Policy",
    academic: "Academic",
    cultural: "Cultural",
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">P</span>
            </div>
            <span className="font-display text-base font-bold text-prism-text-primary">PRISM</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Community card */}
        <div
          className="bg-prism-bg-secondary border border-prism-border rounded-2xl p-5"
          style={{ borderTopWidth: "4px", borderTopColor: color }}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{ backgroundColor: color + "20", color }}
            >
              {community.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-display text-xl font-bold text-prism-text-primary">
                  {community.name}
                </h1>
                {community.verified && (
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill={color}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p className="text-sm text-prism-text-dim mb-2">{community.region}</p>
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: color + "15", color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {TYPE_LABELS[community.community_type as CommunityType]}
              </span>
            </div>
          </div>

          {community.description && (
            <p className="mt-4 text-sm text-prism-text-secondary leading-relaxed">
              {community.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { value: communityPerspectives.length, label: "Perspectives" },
              { value: activeTopics.length, label: "Topics active" },
              {
                value: communityPerspectives.reduce((sum, p) => sum + p.reaction_count, 0),
                label: "Total reactions",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-2 rounded-lg bg-prism-bg-elevated"
              >
                <p className="font-mono text-base font-bold text-prism-text-primary">
                  {stat.value}
                </p>
                <p className="text-[10px] text-prism-text-dim mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active topics */}
        {activeTopics.length > 0 && (
          <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-3">
              Active on these topics
            </h2>
            <div className="space-y-2">
              {activeTopics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/topic/${topic.slug}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-prism-bg-elevated border border-prism-border hover:border-prism-accent-active/30 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-prism-text-primary group-hover:text-prism-accent-active transition-colors">
                      {topic.title}
                    </p>
                    <p className="text-xs text-prism-text-dim mt-0.5">
                      {communityPerspectives.filter((p) => p.topic_slug === topic.slug).length}{" "}
                      {communityPerspectives.filter((p) => p.topic_slug === topic.slug).length === 1
                        ? "perspective"
                        : "perspectives"}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-prism-text-dim group-hover:text-prism-accent-active transition-colors shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Perspectives from this community */}
        {communityPerspectives.length > 0 && (
          <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-3">
              Perspectives
            </h2>
            <div className="space-y-3">
              {communityPerspectives.map((p) => (
                <Link
                  key={p.id}
                  href={`/topic/${p.topic_slug}`}
                  className="block p-4 rounded-xl bg-prism-bg-elevated border border-prism-border hover:border-prism-accent-active/30 transition-all group"
                  style={{ borderLeftWidth: "3px", borderLeftColor: color }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-prism-bg-primary text-prism-text-dim">
                      {p.category_tag}
                    </span>
                    <span className="text-[10px] text-prism-text-dim/60">{p.topic}</span>
                  </div>
                  <blockquote className="font-display italic text-sm leading-relaxed text-prism-text-primary group-hover:text-prism-accent-active/90 transition-colors mb-2">
                    &ldquo;{p.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-prism-text-dim">
                      {p.reaction_count} reactions
                    </span>
                    <span className="text-[10px] font-mono text-prism-text-dim">
                      {p.bookmark_count} bookmarks
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {communityPerspectives.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-prism-text-dim">
              No perspectives from this community yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
