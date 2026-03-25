"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { VerificationGate } from "@/components/verification-gate";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

type ProfileTab = "activity" | "communities" | "connections";

const VERIFICATION_LABELS: Record<number, { label: string; description: string; color: string }> = {
  1: { label: "Level 1", description: "Email verified", color: "text-prism-text-secondary" },
  2: { label: "Level 2", description: "Community verified", color: "text-prism-accent-active" },
  3: { label: "Level 3", description: "Fully verified", color: "text-prism-accent-verified" },
};

interface ProfileData {
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
    radius_miles: number;
    created_at: string;
    like_count: number;
    comment_count: number;
  }[];
  topics_engaged?: number;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [verifyGateLevel, setVerifyGateLevel] = useState<2 | 3>(2);

  useEffect(() => {
    async function fetchProfile() {
      if (session?.access_token) {
        try {
          const res = await fetch("/api/user/profile", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const { data } = await res.json();
          if (data) {
            // Normalize the response — API may return nested or flat
            setProfile({
              id: data.id,
              username: data.username,
              display_name: data.display_name,
              avatar_url: data.avatar_url,
              verification_level: data.verification_level ?? 1,
              ghost_mode: data.ghost_mode ?? false,
              home_community: data.home_community ?? null,
              profile: data.profile ?? {
                perspectives_read: data.perspectives_read ?? 0,
                communities_engaged: data.communities_engaged ?? 0,
                connections_made: data.connections_made ?? 0,
              },
              recent_posts: data.recent_posts ?? [],
              topics_engaged: data.topics_engaged ?? 0,
            });
            setLoading(false);
            return;
          }
        } catch {
          // API unavailable
        }
      }
      // No session or API failed — show empty profile
      setProfile(null);
      setLoading(false);
    }
    fetchProfile();
  }, [session?.access_token]);

  const user = profile;
  const verification = VERIFICATION_LABELS[user?.verification_level ?? 1];
  const stats = user?.profile ?? { perspectives_read: 0, communities_engaged: 0, connections_made: 0 };

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "activity", label: "Activity" },
    { id: "communities", label: "Communities" },
    { id: "connections", label: "Connections" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-primary p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-prism-bg-elevated animate-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-prism-bg-elevated rounded-full w-1/3 animate-shimmer" />
              <div className="h-3 bg-prism-bg-elevated rounded-full w-1/4 animate-shimmer" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-prism-bg-elevated rounded-xl animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-prism-bg-primary">
      {/* Header */}
      <header className="border-b border-prism-border bg-prism-bg-secondary/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-prism-text-dim hover:text-prism-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm">Back</span>
          </Link>
          <Link href="/settings" className="p-2 rounded-lg text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile card */}
        <div className="bg-prism-bg-secondary rounded-2xl border border-prism-border p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora flex items-center justify-center shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name ?? user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-display font-bold text-xl">
                  {(user.display_name ?? user.username).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-prism-text-primary">
                {user.display_name ?? user.username}
              </h1>
              <p className="text-sm text-prism-text-secondary">@{user.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${verification.color}`}>
                  {verification.label}
                </span>
                <span className="text-xs text-prism-text-dim">· {verification.description}</span>
                {user.verification_level < 3 && (
                  <button
                    onClick={() => {
                      setVerifyGateLevel(user.verification_level < 2 ? 2 : 3);
                      setVerifyGateOpen(true);
                    }}
                    className="text-[10px] font-medium text-prism-accent-active hover:text-prism-accent-active/80 transition-colors"
                  >
                    Upgrade
                  </button>
                )}
              </div>
              {user.home_community && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COMMUNITY_COLORS[user.home_community.community_type] }}
                  />
                  <span className="text-xs text-prism-text-secondary">
                    {user.home_community.name} · {user.home_community.region}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-prism-border">
            <div className="text-center">
              <span className="font-mono text-xl font-bold text-prism-text-primary">{stats.perspectives_read}</span>
              <p className="text-[10px] text-prism-text-dim mt-0.5">Perspectives Read</p>
            </div>
            <div className="text-center">
              <span className="font-mono text-xl font-bold text-prism-text-primary">{stats.communities_engaged}</span>
              <p className="text-[10px] text-prism-text-dim mt-0.5">Communities Engaged</p>
            </div>
            <div className="text-center">
              <span className="font-mono text-xl font-bold text-prism-text-primary">{stats.connections_made}</span>
              <p className="text-[10px] text-prism-text-dim mt-0.5">Connections Made</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/bookmarks"
            className="bg-prism-bg-secondary rounded-xl border border-prism-border p-4 hover:bg-prism-bg-elevated transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-prism-accent-active/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-prism-accent-active" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-prism-text-primary">Saved</span>
                <p className="text-[10px] text-prism-text-dim">Bookmarks</p>
              </div>
            </div>
          </Link>
          <Link
            href="/notifications"
            className="bg-prism-bg-secondary rounded-xl border border-prism-border p-4 hover:bg-prism-bg-elevated transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-prism-accent-like/10 flex items-center justify-center relative">
                <svg className="w-5 h-5 text-prism-accent-like" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-prism-accent-live" />
              </div>
              <div>
                <span className="text-sm font-medium text-prism-text-primary">Notifications</span>
                <p className="text-[10px] text-prism-text-dim">2 unread</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-prism-bg-elevated rounded-full p-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-prism-accent-active text-white shadow-sm scale-[1.01]"
                  : "text-prism-text-secondary hover:text-prism-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "activity" && (
          <div className="space-y-3 animate-fade-in">
            {user.recent_posts.length > 0 ? (
              <div className="bg-prism-bg-secondary rounded-xl border border-prism-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-prism-text-dim uppercase tracking-wider">Recent Posts</span>
                </div>
                <div className="space-y-3">
                  {user.recent_posts.map((post) => (
                    <div key={post.id} className="py-2 border-b border-prism-border/50 last:border-0">
                      <p className="text-sm text-prism-text-primary leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-prism-text-dim font-mono">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-prism-text-dim">
                          {post.radius_miles} mi
                        </span>
                        {post.post_type === "story" && (
                          <span className="text-[10px] text-amber-400">Story</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-prism-bg-secondary rounded-xl border border-prism-border p-6 text-center">
                <p className="text-sm text-prism-text-dim">No recent posts yet</p>
                <p className="text-xs text-prism-text-dim/60 mt-1">Create your first post from the home page</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "communities" && (
          <div className="space-y-2 animate-fade-in">
            {user.home_community ? (
              <Link
                href={`/community/${user.home_community.id}`}
                className="flex items-center gap-3 bg-prism-bg-secondary rounded-xl border border-prism-border p-4 hover:bg-prism-bg-elevated transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: COMMUNITY_COLORS[user.home_community.community_type] + "20",
                    color: COMMUNITY_COLORS[user.home_community.community_type],
                  }}
                >
                  {user.home_community.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-prism-text-primary truncate">{user.home_community.name}</span>
                    {user.home_community.verified && (
                      <svg className="w-3.5 h-3.5 text-prism-accent-verified shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-prism-text-dim">{user.home_community.region}</span>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: COMMUNITY_COLORS[user.home_community.community_type] + "15",
                    color: COMMUNITY_COLORS[user.home_community.community_type],
                  }}
                >
                  {user.home_community.community_type}
                </span>
              </Link>
            ) : (
              <div className="bg-prism-bg-secondary rounded-xl border border-prism-border p-6 text-center">
                <p className="text-sm text-prism-text-dim">No community joined yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "connections" && (
          <div className="bg-prism-bg-secondary rounded-xl border border-prism-border p-6 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-prism-bg-elevated flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-prism-text-primary mb-1">{stats.connections_made} connections</p>
            <p className="text-xs text-prism-text-dim">Connect with people from different communities who share perspectives on the same topics.</p>
          </div>
        )}
      </div>

      <VerificationGate
        open={verifyGateOpen}
        onClose={() => setVerifyGateOpen(false)}
        requiredLevel={verifyGateLevel}
        onVerified={(level) => {
          if (profile) {
            setProfile({ ...profile, verification_level: level });
          }
        }}
      />
    </div>
  );
}
