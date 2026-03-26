"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";

type ProfileTab = "perspectives" | "saved" | "settings";

export default function ProfilePage() {
  const { session, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("perspectives");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("prism_streak");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStreak(data.count ?? 0);
      } catch {
        // ignore
      }
    }
  }, []);

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
              {user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "User"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {user?.user_metadata?.location ?? "Location not set"}
            </p>
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
          <EmptyState {...EMPTY_STATES.profile} />
        )}
        {activeTab === "saved" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-1">No saved perspectives</p>
            <p className="text-xs text-[var(--text-dim)]">Bookmark perspectives to save them here.</p>
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
