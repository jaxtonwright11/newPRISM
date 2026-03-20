import Link from "next/link";
import { SEED_PERSPECTIVES, SEED_COMMUNITIES } from "@/lib/seed-data";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

const MOCK_USER = {
  display_name: "Jax Wright",
  username: "jaxwright",
  home_community: SEED_COMMUNITIES[0],
  verification_level: 2 as const,
  ghost_mode: false,
  default_radius_miles: 40 as const,
  joined: "March 2026",
  perspectives_read: 47,
  communities_engaged: 8,
  connections_made: 3,
  bio: "Exploring how different communities see the same world. Based in West Virginia.",
};

const RECENT_PERSPECTIVES = SEED_PERSPECTIVES.slice(0, 4);

const VERIFICATION_INFO: Record<number, { label: string; color: string; description: string }> = {
  1: { label: "Level 1", color: "#4A9EFF", description: "Email verified. Can read and react." },
  2: { label: "Level 2", color: "#4AE87A", description: "Location verified. Can post and connect." },
  3: { label: "Level 3", color: "#F59E0B", description: "Identity verified. Community contributor." },
};

export default function ProfilePage() {
  const verif = VERIFICATION_INFO[MOCK_USER.verification_level];
  const communityColor = COMMUNITY_COLORS[MOCK_USER.home_community.community_type as CommunityType];

  return (
    <div className="min-h-screen bg-prism-bg-primary">
      {/* Header */}
      <header className="bg-prism-bg-secondary border-b border-prism-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-prism-text-dim hover:text-prism-text-primary transition-colors"
            aria-label="Back to home"
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
          <div className="flex-1" />
          <Link
            href="/settings"
            className="p-1.5 rounded-lg text-prism-text-dim hover:text-prism-text-primary transition-colors"
            aria-label="Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Profile card */}
        <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{
                backgroundColor: communityColor + "20",
                color: communityColor,
              }}
            >
              {MOCK_USER.display_name.split(" ").map((w) => w[0]).join("")}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl font-bold text-prism-text-primary">
                  {MOCK_USER.display_name}
                </h1>
                {/* Verification badge */}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: verif.color + "20", color: verif.color }}
                >
                  ✓ {verif.label}
                </span>
              </div>
              <p className="text-sm text-prism-text-dim">@{MOCK_USER.username}</p>
              {MOCK_USER.bio && (
                <p className="text-sm text-prism-text-secondary mt-2 leading-relaxed">
                  {MOCK_USER.bio}
                </p>
              )}
            </div>
          </div>

          {/* Home community */}
          <div className="mt-4 p-3 rounded-xl bg-prism-bg-elevated border border-prism-border flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: communityColor + "20", color: communityColor }}
            >
              {MOCK_USER.home_community.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <p className="text-xs font-medium text-prism-text-secondary">Home community</p>
              <p className="text-sm font-medium text-prism-text-primary">
                {MOCK_USER.home_community.name}
              </p>
            </div>
            <svg
              className="w-3 h-3 text-prism-text-dim ml-auto shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>

          {/* Stats — no follower counts, only connection-based */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { value: MOCK_USER.perspectives_read, label: "Perspectives read" },
              { value: MOCK_USER.communities_engaged, label: "Communities" },
              { value: MOCK_USER.connections_made, label: "Connected" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-2 rounded-lg bg-prism-bg-elevated">
                <p className="font-mono text-lg font-bold text-prism-text-primary">{stat.value}</p>
                <p className="text-[10px] text-prism-text-dim mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-prism-text-dim/60 mt-3 text-center">
            No follower counts. Community identity over individual status.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/messages"
            className="flex items-center gap-3 p-4 rounded-2xl bg-prism-bg-secondary border border-prism-border hover:border-prism-accent-active/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-prism-accent-active/20 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-prism-accent-active w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-prism-text-primary">Messages</p>
              <p className="text-xs text-prism-text-dim">3 connections</p>
            </div>
          </Link>
          <Link
            href="/bookmarks"
            className="flex items-center gap-3 p-4 rounded-2xl bg-prism-bg-secondary border border-prism-border hover:border-prism-accent-active/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-prism-accent-active/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-prism-accent-active" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-prism-text-primary">Saved</p>
              <p className="text-xs text-prism-text-dim">4 perspectives</p>
            </div>
          </Link>
        </div>

        {/* Ghost mode + radius quick settings */}
        <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-3">
            Your presence
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/settings"
              className="p-3 rounded-xl bg-prism-bg-elevated border border-prism-border hover:border-prism-accent-active/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-medium text-prism-text-primary">Visible</span>
              </div>
              <p className="text-[10px] text-prism-text-dim">Your pin is on the map</p>
            </Link>
            <Link
              href="/settings"
              className="p-3 rounded-xl bg-prism-bg-elevated border border-prism-border hover:border-prism-accent-active/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="text-xs font-medium text-prism-text-primary">40mi radius</span>
              </div>
              <p className="text-[10px] text-prism-text-dim">Exact location hidden</p>
            </Link>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-3">
            Recently engaged with
          </h2>
          <div className="space-y-2">
            {RECENT_PERSPECTIVES.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-prism-bg-elevated border border-prism-border"
                style={{ borderLeftWidth: "3px", borderLeftColor: p.community.color_hex }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: p.community.color_hex }}
                  >
                    {p.community.name}
                  </span>
                  <span className="text-[10px] text-prism-text-dim">· {p.category_tag}</span>
                </div>
                <p className="text-xs text-prism-text-secondary italic leading-relaxed line-clamp-2">
                  &ldquo;{p.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Verification path */}
        <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-3">
            Verification
          </h2>
          <div className="space-y-2">
            {[1, 2, 3].map((level) => {
              const info = VERIFICATION_INFO[level];
              const isActive = MOCK_USER.verification_level >= level;
              return (
                <div
                  key={level}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    isActive
                      ? "bg-prism-bg-elevated border border-prism-border"
                      : "opacity-40"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: info.color + "20", color: info.color }}
                  >
                    {isActive ? "✓" : level}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-prism-text-primary">{info.label}</p>
                    <p className="text-[10px] text-prism-text-dim">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
