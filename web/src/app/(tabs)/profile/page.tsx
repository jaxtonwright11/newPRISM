"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { PerspectiveCard } from "@/components/perspective-card";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";
import { getStreak, getStreakMessage } from "@/lib/streak";
import type { CommunityType } from "@shared/types";

type ProfileTab = "perspectives" | "saved" | "settings";

interface UserPost {
  id: string;
  content: string;
  post_type: string;
  created_at: string;
  community?: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
}

export default function ProfilePage() {
  const { session, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("perspectives");
  const [streak, setStreak] = useState(0);
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    const data = getStreak();
    setStreak(data.count);
    setStreakMessage(getStreakMessage(data.count));
  }, []);

  // Fetch profile data including bio and user posts
  useEffect(() => {
    if (!session?.access_token) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };

    fetch("/api/user/profile", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setDisplayName(data.data.display_name ?? null);
          const profile = Array.isArray(data.data.profile) ? data.data.profile[0] : data.data.profile;
          setBio(profile?.bio ?? null);
        }
      })
      .catch(() => {});

    fetch("/api/posts?own=true", { headers })
      .then((res) => res.json())
      .then((data) => setUserPosts(data.posts ?? data.data ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [session?.access_token]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">
          Your perspective matters.
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Everything you share here becomes part of your community&apos;s story.
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "perspectives", label: "My Perspectives" },
    { id: "saved", label: "Saved" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Profile header */}
      <header className="px-4 pt-6 pb-4 border-b border-[var(--bg-elevated)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
            <span className="font-display font-bold text-xl text-[var(--accent-primary)]">
              {user?.email?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-lg text-[var(--text-primary)]">
              {displayName ?? user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "User"}
            </h1>
            {bio ? (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{bio}</p>
            ) : (
              <p className="text-sm text-[var(--text-dim)]">
                <Link href="/settings" className="hover:text-[var(--accent-primary)] transition-colors">
                  Add a bio →
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Streak counter */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--bg-elevated)]">
          <span className="text-[var(--accent-primary)]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 23c-3.5-1.5-7-5-7-10 0-3 1.5-5.5 3-7l1 3c1-2 3-4 3-7 3 3.5 7 7.5 7 14-2-1-3.5-2-4-3-.5 2-1.5 3.5-3 3.5V23z" />
            </svg>
          </span>
          <span className="font-mono font-medium text-sm text-[var(--text-primary)]">{streak}</span>
          <span className="text-xs text-[var(--text-secondary)]">day streak</span>
          {streakMessage && (
            <span className="text-xs text-[var(--text-dim)] ml-2">{streakMessage}</span>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[var(--bg-elevated)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-body font-medium text-center transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                : "border-transparent text-[var(--text-secondary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "perspectives" && (
          postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-[var(--bg-elevated)] rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : userPosts.length > 0 ? (
            <div className="space-y-3">
              {userPosts.map((post) => (
                <div key={post.id} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-elevated)] p-4">
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-[var(--text-dim)]">
                      {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-dim)]">
                      {post.post_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState {...EMPTY_STATES.profile} />
          )
        )}
        {activeTab === "saved" && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-[var(--text-secondary)] mb-4">Your saved perspectives and topics are in one place.</p>
            <Link
              href="/bookmarks"
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-sm transition-opacity hover:opacity-90"
            >
              View Saved
            </Link>
          </div>
        )}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-3">
            <Link
              href="/settings"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] font-body text-sm"
            >
              Account Settings
              <svg className="w-4 h-4 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
