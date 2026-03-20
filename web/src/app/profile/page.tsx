"use client";

import { useState } from "react";
import Link from "next/link";
import { PersonalPostCard } from "@/components/personal-post-card";
import {
  SEED_USERS,
  SEED_POSTS,
  SEED_COMMUNITIES,
} from "@/lib/seed-data";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType, VerificationLevel } from "@shared/types";

type ProfileTab = "posts" | "perspectives" | "bookmarks";

const VERIFICATION_LABELS: Record<
  VerificationLevel,
  { label: string; description: string }
> = {
  1: {
    label: "Level 1 — Reader",
    description: "Browse, react, and discover",
  },
  2: {
    label: "Level 2 — Member",
    description: "Post, connect, and appear on map",
  },
  3: {
    label: "Level 3 — Contributor",
    description: "Submit official community perspectives",
  },
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const user = SEED_USERS[4];
  const community = SEED_COMMUNITIES.find(
    (c) => c.id === user.home_community_id
  );
  const communityColor = community
    ? COMMUNITY_COLORS[community.community_type as CommunityType]
    : "#4A9EFF";

  const userPosts = SEED_POSTS.filter((p) => p.user_id === user.id);
  const verification = VERIFICATION_LABELS[user.verification_level];

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "perspectives", label: "Perspectives" },
    { id: "bookmarks", label: "Bookmarks" },
  ];

  return (
    <div className="min-h-screen bg-prism-bg-primary">
      {/* Header nav */}
      <header className="border-b border-prism-border bg-prism-bg-secondary/95 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-prism-text-dim hover:text-prism-text-primary transition-colors"
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            <span className="text-sm">Home</span>
          </Link>
          <button className="p-2 rounded-lg text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4">
        {/* Profile header */}
        <div className="py-6 flex flex-col items-center text-center">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold mb-4"
            style={{
              backgroundColor: communityColor + "20",
              color: communityColor,
            }}
          >
            {user.display_name
              ? user.display_name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
              : user.username.slice(0, 2).toUpperCase()}
          </div>

          <h1 className="text-xl font-semibold text-prism-text-primary mb-0.5">
            {user.display_name ?? user.username}
          </h1>
          <p className="text-sm text-prism-text-secondary mb-3">
            @{user.username}
          </p>

          {/* Community badge */}
          {community && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{
                backgroundColor: communityColor + "15",
                color: communityColor,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: communityColor }}
              />
              {community.name}
              <span className="text-prism-text-dim">·</span>
              <span className="text-prism-text-dim">{community.region}</span>
            </div>
          )}

          {/* Verification badge */}
          <div className="flex items-center gap-1.5 mb-5">
            <svg
              className="w-4 h-4 text-prism-accent-verified"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-prism-accent-verified font-medium">
              {verification.label}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6">
            <StatBlock value={user.perspectives_read} label="Read" />
            <StatBlock value={user.communities_engaged} label="Communities" />
            <StatBlock value={user.connections_made} label="Connections" />
          </div>
        </div>

        {/* Ghost mode toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-prism-bg-secondary border border-prism-border mb-6">
          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 text-prism-text-dim"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
            <div>
              <p className="text-sm text-prism-text-primary">Ghost Mode</p>
              <p className="text-[10px] text-prism-text-dim">
                Posts show as &quot;Anonymous from {community?.region}&quot;
              </p>
            </div>
          </div>
          <GhostModeToggle initialState={user.ghost_mode} />
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-prism-bg-secondary rounded-full p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-prism-accent-active text-white"
                  : "text-prism-text-secondary hover:text-prism-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pb-8">
          {activeTab === "posts" && (
            <div className="space-y-3">
              {userPosts.length > 0 ? (
                userPosts.map((post, i) => (
                  <PersonalPostCard
                    key={post.id}
                    post={post}
                    animationDelay={i * 50}
                  />
                ))
              ) : (
                <EmptyState message="No posts yet. Share your first perspective from your community." />
              )}
            </div>
          )}

          {activeTab === "perspectives" && (
            <EmptyState message="Perspectives you've reacted to will appear here." />
          )}

          {activeTab === "bookmarks" && (
            <EmptyState message="Bookmarked perspectives and posts will appear here." />
          )}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <span className="text-lg font-mono font-bold text-prism-text-primary">
        {value}
      </span>
      <p className="text-[10px] text-prism-text-dim">{label}</p>
    </div>
  );
}

function GhostModeToggle({ initialState }: { initialState: boolean }) {
  const [enabled, setEnabled] = useState(initialState);
  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
        enabled ? "bg-prism-accent-active" : "bg-prism-bg-elevated"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 rounded-full bg-prism-bg-elevated flex items-center justify-center mx-auto mb-3">
        <svg
          className="w-6 h-6 text-prism-text-dim"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <p className="text-sm text-prism-text-dim">{message}</p>
    </div>
  );
}
