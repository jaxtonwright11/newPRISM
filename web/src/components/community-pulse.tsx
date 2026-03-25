"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

interface PulseData {
  top_topic: {
    id: string;
    title: string;
    slug: string;
    perspective_count: number;
    community_count: number;
  } | null;
  most_reacted: {
    id: string;
    quote: string;
    reaction_count: number;
    community: {
      name: string;
      community_type: CommunityType;
    };
  } | null;
  new_communities: {
    id: string;
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  }[];
}

interface CommunityPulseProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityPulse({ isOpen, onClose }: CommunityPulseProps) {
  const { session } = useAuth();
  const [pulse, setPulse] = useState<PulseData | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchPulse() {
      try {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        const res = await fetch("/api/pulse", { headers });
        const data = await res.json();
        if (data.top_topic || data.most_reacted) {
          setPulse(data);
          return;
        }
      } catch {
        // API unavailable — show empty pulse
        setPulse({ top_topic: null, most_reacted: null, new_communities: [] });
      }
    }
    fetchPulse();
  }, [isOpen, session?.access_token]);

  if (!isOpen) return null;

  const topTopic = pulse?.top_topic;
  const mostReacted = pulse?.most_reacted;
  const newCommunities = pulse?.new_communities ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 md:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-prism-bg-secondary border border-prism-border rounded-2xl shadow-2xl animate-slide-in-right overflow-hidden mt-12 md:mt-0">
        {/* Header */}
        <div className="p-4 border-b border-prism-border bg-prism-bg-elevated/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-prism-accent-active/15 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-prism-accent-active"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-prism-text-primary">
                  Community Pulse
                </h2>
                <p className="text-[10px] text-prism-text-dim">
                  Today in your communities
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {!pulse ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-prism-bg-elevated rounded-xl p-4 space-y-2">
                  <div className="h-3 bg-prism-bg-secondary rounded-full w-1/3 animate-shimmer" />
                  <div className="h-4 bg-prism-bg-secondary rounded-full w-2/3 animate-shimmer" />
                  <div className="h-3 bg-prism-bg-secondary rounded-full w-1/2 animate-shimmer" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Top topic */}
              {topTopic && (
                <PulseSection
                  icon={
                    <svg className="w-4 h-4 text-prism-accent-live" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    </svg>
                  }
                  label="TOP TOPIC TODAY"
                >
                  <div className="p-3 rounded-lg bg-prism-bg-elevated border border-prism-border">
                    <p className="text-sm font-medium text-prism-text-primary mb-1">
                      {topTopic.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-prism-text-dim">
                        {topTopic.perspective_count} perspectives
                      </span>
                      <span className="text-prism-text-dim">·</span>
                      <span className="text-[10px] font-mono text-prism-text-dim">
                        {topTopic.community_count} communities
                      </span>
                    </div>
                  </div>
                </PulseSection>
              )}

              {/* Most reacted perspective */}
              {mostReacted && (
                <PulseSection
                  icon={
                    <svg className="w-4 h-4 text-prism-accent-verified" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  }
                  label="MOST REACTED PERSPECTIVE"
                >
                  <div
                    className="p-3 rounded-lg bg-prism-bg-elevated border border-prism-border"
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor:
                        COMMUNITY_COLORS[mostReacted.community.community_type],
                    }}
                  >
                    <p className="text-sm text-prism-text-primary italic font-display leading-snug mb-2">
                      &ldquo;
                      {mostReacted.quote.length > 100
                        ? mostReacted.quote.slice(0, 100) + "..."
                        : mostReacted.quote}
                      &rdquo;
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-prism-text-dim">
                        {mostReacted.community.name}
                      </span>
                      <span className="text-[10px] font-mono text-prism-accent-active">
                        {mostReacted.reaction_count} reactions
                      </span>
                    </div>
                  </div>
                </PulseSection>
              )}

              {/* New communities posting */}
              {newCommunities.length > 0 && (
                <PulseSection
                  icon={
                    <svg className="w-4 h-4 text-prism-community-diaspora" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  }
                  label="COMMUNITIES TO DISCOVER"
                >
                  <div className="space-y-2">
                    {newCommunities.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-prism-bg-elevated border border-prism-border hover:border-prism-border/80 transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{
                            backgroundColor: COMMUNITY_COLORS[c.community_type] + "20",
                            color: COMMUNITY_COLORS[c.community_type],
                          }}
                        >
                          {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-prism-text-primary truncate block">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-prism-text-dim">
                            {c.region}
                          </span>
                        </div>
                        {c.verified && (
                          <svg className="w-3.5 h-3.5 text-prism-accent-verified shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </PulseSection>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PulseSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-prism-text-dim">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
