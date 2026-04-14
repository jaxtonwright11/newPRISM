"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { CommunityType } from "@shared/types";
import { COMMUNITY_COLORS } from "@/lib/constants";

interface UserPost {
  id: string;
  content: string;
  created_at: string;
}

interface TopicWithPerspectives {
  id: string;
  title: string;
  slug: string;
  perspectives: {
    id: string;
    quote: string;
    community: { name: string; community_type: string; color_hex: string };
  }[];
}

/**
 * Shown when the For You feed is empty. Gives a new user something real to see.
 * Surfaces: their own recent post, a topic comparison if available, and a clear next action.
 */
export function FirstSessionCard() {
  const { session } = useAuth();
  const [userPost, setUserPost] = useState<UserPost | null>(null);
  const [topicPreview, setTopicPreview] = useState<TopicWithPerspectives | null>(null);
  const [communities, setCommunities] = useState<{ id: string; name: string; community_type: string; color_hex: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const fetches: Promise<void>[] = [];

    // Fetch user's own recent post (from onboarding)
    if (session?.access_token) {
      fetches.push(
        fetch("/api/posts?own=true&limit=1", { headers })
          .then((r) => r.json())
          .then((data) => {
            const posts = data.data ?? data.posts ?? [];
            if (posts.length > 0) setUserPost(posts[0]);
          })
          .catch(() => {})
      );
    }

    // Fetch a topic that has perspectives from multiple communities
    fetches.push(
      fetch("/api/topics")
        .then((r) => r.json())
        .then(async (data) => {
          const topics = data.topics ?? [];
          // Find a topic with perspectives
          for (const topic of topics.slice(0, 5)) {
            try {
              const res = await fetch(`/api/topics/${topic.slug}`);
              const tData = await res.json();
              const perspectives = tData.perspectives ?? [];
              if (perspectives.length >= 2) {
                // Get 2 perspectives from different communities
                const seen = new Set<string>();
                const diverse: TopicWithPerspectives["perspectives"] = [];
                for (const p of perspectives) {
                  const name = p.community?.name;
                  if (name && !seen.has(name) && diverse.length < 2) {
                    seen.add(name);
                    diverse.push({
                      id: p.id,
                      quote: p.quote,
                      community: {
                        name: p.community.name,
                        community_type: p.community.community_type,
                        color_hex: p.community.color_hex,
                      },
                    });
                  }
                }
                if (diverse.length >= 2) {
                  setTopicPreview({ id: topic.id, title: topic.title, slug: topic.slug, perspectives: diverse });
                  return;
                }
              }
            } catch {
              // continue
            }
          }
        })
        .catch(() => {})
    );

    // Fetch communities for the "follow" suggestion
    fetches.push(
      fetch("/api/communities")
        .then((r) => r.json())
        .then((data) => setCommunities((data.communities ?? data ?? []).slice(0, 5)))
        .catch(() => {})
    );

    Promise.all(fetches).finally(() => setLoading(false));
  }, [session?.access_token]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-[var(--bg-elevated)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Welcome message */}
      <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] p-5">
        <h2 className="font-display font-bold text-lg text-[var(--text-primary)] mb-1">
          Welcome to PRISM
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          PRISM shows you how different communities experience the same events. Your feed will grow as more communities share perspectives.
        </p>
      </div>

      {/* User's own post from onboarding */}
      {userPost && (
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-primary)]/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
            <span className="text-xs font-medium text-[var(--accent-primary)]">Your perspective</span>
          </div>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            &ldquo;{userPost.content}&rdquo;
          </p>
          <p className="text-[10px] text-[var(--text-dim)] mt-2">
            This is visible to communities near you in the Nearby feed.
          </p>
        </div>
      )}

      {/* Topic comparison preview — the activation event */}
      {topicPreview && (
        <Link
          href={`/compare/${topicPreview.slug}`}
          className="block rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] overflow-hidden hover:border-[var(--accent-primary)]/30 transition-colors"
        >
          <div className="px-4 py-3 border-b border-[var(--bg-elevated)]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent-primary)]">
              Same topic &middot; Different worlds
            </span>
            <h3 className="text-sm font-display font-bold text-[var(--text-primary)] mt-0.5">
              {topicPreview.title}
            </h3>
          </div>
          {topicPreview.perspectives.map((p) => {
            const color = p.community.color_hex;
            return (
              <div key={p.id} className="px-4 py-3 border-b border-[var(--bg-elevated)]/50 relative">
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ backgroundColor: color }}
                />
                <div className="pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }}
                    />
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      {p.community.name}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--text-primary)] leading-relaxed line-clamp-2">
                    &ldquo;{p.quote}&rdquo;
                  </p>
                </div>
              </div>
            );
          })}
          <div className="px-4 py-2.5">
            <span className="text-xs text-[var(--accent-primary)]">
              See the full comparison &rarr;
            </span>
          </div>
        </Link>
      )}

      {/* Communities to follow */}
      {communities.length > 0 && (
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] p-4">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Communities on PRISM
          </h3>
          <div className="flex flex-wrap gap-2">
            {communities.map((c) => {
              const color = COMMUNITY_COLORS[c.community_type as CommunityType] ?? c.color_hex;
              return (
                <Link
                  key={c.id}
                  href={`/community/${c.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)]/30 border border-transparent transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}30` }}
                  />
                  <span className="text-xs text-[var(--text-primary)]">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear next action */}
      <div className="flex flex-col gap-2">
        <Link
          href="/discover"
          className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium text-center hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 transition-all"
        >
          Explore perspectives
        </Link>
        <Link
          href="/create"
          className="w-full py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-elevated)] text-sm text-[var(--text-secondary)] text-center hover:text-[var(--text-primary)] hover:border-[var(--text-dim)]/30 transition-all"
        >
          Share a perspective
        </Link>
      </div>
    </div>
  );
}
