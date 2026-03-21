"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

const VERIFICATION_LABELS: Record<number, { label: string; description: string; color: string }> = {
  1: { label: "Level 1", description: "Email verified", color: "text-prism-text-secondary" },
  2: { label: "Level 2", description: "Community verified", color: "text-prism-accent-active" },
  3: { label: "Level 3", description: "Fully verified", color: "text-prism-accent-verified" },
};

interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verification_level: number;
  ghost_mode: boolean;
  home_community: {
    id: string;
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  } | null;
  profile: {
    perspectives_read: number;
    communities_engaged: number;
    connections_made: number;
  } | null;
  recent_posts: {
    id: string;
    content: string;
    post_type: string;
    created_at: string;
  }[];
  topics_engaged: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/user/${userId}`);
        if (!res.ok) {
          setError(res.status === 404 ? "User not found" : "Failed to load profile");
          setLoading(false);
          return;
        }
        const { data } = await res.json();
        setProfile(data);
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-primary flex items-center justify-center">
        <div className="flex items-center gap-2 text-prism-text-dim text-sm">
          <div className="w-4 h-4 border-2 border-prism-text-dim/30 border-t-prism-text-dim rounded-full animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-prism-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-prism-text-dim text-sm">{error ?? "Profile not found"}</p>
          <Link href="/" className="text-xs text-prism-accent-active mt-2 inline-block hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const verification = VERIFICATION_LABELS[profile.verification_level ?? 1];
  const stats = profile.profile ?? { perspectives_read: 0, communities_engaged: 0, connections_made: 0 };

  return (
    <div className="min-h-screen bg-prism-bg-primary">
      <header className="border-b border-prism-border bg-prism-bg-secondary/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-prism-text-dim hover:text-prism-text-primary transition-colors w-fit">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-prism-bg-secondary rounded-2xl border border-prism-border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora flex items-center justify-center shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name ?? profile.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-display font-bold text-xl">
                  {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-prism-text-primary">
                {profile.ghost_mode ? "Anonymous User" : (profile.display_name ?? profile.username)}
              </h1>
              {!profile.ghost_mode && (
                <p className="text-sm text-prism-text-secondary">@{profile.username}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${verification.color}`}>
                  {verification.label}
                </span>
              </div>
              {profile.home_community && !profile.ghost_mode && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COMMUNITY_COLORS[profile.home_community.community_type] }}
                  />
                  <span className="text-xs text-prism-text-secondary">
                    {profile.home_community.name} · {profile.home_community.region}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-prism-border">
            <div className="text-center">
              <span className="font-mono text-xl font-bold text-prism-text-primary">{stats.perspectives_read}</span>
              <p className="text-[10px] text-prism-text-dim mt-0.5">Perspectives Read</p>
            </div>
            <div className="text-center">
              <span className="font-mono text-xl font-bold text-prism-text-primary">{stats.communities_engaged}</span>
              <p className="text-[10px] text-prism-text-dim mt-0.5">Communities</p>
            </div>
            <div className="text-center">
              <span className="font-mono text-xl font-bold text-prism-text-primary">{stats.connections_made}</span>
              <p className="text-[10px] text-prism-text-dim mt-0.5">Connections</p>
            </div>
          </div>
        </div>

        {/* Recent posts */}
        {profile.recent_posts.length > 0 && !profile.ghost_mode && (
          <div className="bg-prism-bg-secondary rounded-xl border border-prism-border p-4">
            <span className="text-xs font-semibold text-prism-text-dim uppercase tracking-wider">Recent Posts</span>
            <div className="space-y-3 mt-3">
              {profile.recent_posts.map((post) => (
                <div key={post.id} className="py-2 border-b border-prism-border/50 last:border-0">
                  <p className="text-sm text-prism-text-primary leading-relaxed">{post.content}</p>
                  <span className="text-[10px] text-prism-text-dim font-mono">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
