"use client";

import Link from "next/link";
import { useState } from "react";
import { GhostModeToggle } from "@/components/ghost-mode-toggle";
import type { RadiusMiles } from "@shared/types";

const RADIUS_OPTIONS: RadiusMiles[] = [10, 20, 30, 40];

export default function SettingsPage() {
  const [ghostMode, setGhostMode] = useState(false);
  const [radius, setRadius] = useState<RadiusMiles>(40);
  const [notifications, setNotifications] = useState({
    communityPulse: true,
    connections: true,
    perspectives: false,
  });

  return (
    <div className="min-h-screen bg-prism-bg-primary">
      {/* Header */}
      <header className="bg-prism-bg-secondary border-b border-prism-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/profile"
            className="p-1.5 rounded-lg text-prism-text-dim hover:text-prism-text-primary transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="font-display text-base font-bold text-prism-text-primary">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Privacy / Presence */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim px-1 mb-3">
            Presence
          </h2>

          <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl overflow-hidden divide-y divide-prism-border">
            {/* Ghost mode */}
            <div className="p-4">
              <GhostModeToggle
                enabled={ghostMode}
                onToggle={() => setGhostMode(!ghostMode)}
              />
            </div>

            {/* Radius */}
            <div className="p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-prism-text-primary mb-0.5">Post radius</p>
                <p className="text-xs text-prism-text-dim">
                  Posts appear within this radius on the map. Your exact location is never shared.
                </p>
              </div>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      radius === r
                        ? "bg-prism-accent-active/20 text-prism-accent-active border border-prism-accent-active/40"
                        : "bg-prism-bg-elevated text-prism-text-dim hover:text-prism-text-secondary border border-transparent"
                    }`}
                  >
                    {r}mi
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim px-1 mb-3">
            Notifications
          </h2>

          <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl overflow-hidden divide-y divide-prism-border">
            {[
              {
                key: "communityPulse" as const,
                label: "Community Pulse",
                description: "Daily digest of what's happening in your community",
                recommended: true,
              },
              {
                key: "connections" as const,
                label: "Connection requests",
                description: "When someone from another community wants to connect",
              },
              {
                key: "perspectives" as const,
                label: "New perspectives",
                description: "When a community you follow posts on a new topic",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-prism-text-primary">{item.label}</p>
                    {item.recommended && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-prism-accent-verified/20 text-prism-accent-verified">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-prism-text-dim mt-0.5">{item.description}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key],
                    }))
                  }
                  role="switch"
                  aria-checked={notifications[item.key]}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 ml-3 ${
                    notifications[item.key]
                      ? "bg-prism-accent-active"
                      : "bg-prism-bg-elevated border border-prism-border"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      notifications[item.key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-prism-text-dim/60 mt-2 px-1">
            PRISM sends very few notifications. Designed to not create badge anxiety.
          </p>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim px-1 mb-3">
            Account
          </h2>

          <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl overflow-hidden divide-y divide-prism-border">
            <Link
              href="/profile"
              className="flex items-center justify-between p-4 hover:bg-prism-bg-elevated transition-colors"
            >
              <p className="text-sm text-prism-text-primary">Edit profile</p>
              <svg className="w-4 h-4 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <button className="w-full flex items-center justify-between p-4 hover:bg-prism-bg-elevated transition-colors">
              <p className="text-sm text-prism-text-primary">Verification</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-prism-accent-verified/20 text-prism-accent-verified">
                  Level 2
                </span>
                <svg className="w-4 h-4 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-prism-bg-elevated transition-colors">
              <p className="text-sm text-prism-text-primary">Data & privacy</p>
              <svg className="w-4 h-4 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim px-1 mb-3">
            About
          </h2>
          <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">P</span>
              </div>
              <div>
                <p className="text-sm font-bold font-display text-prism-text-primary">PRISM</p>
                <p className="text-[10px] text-prism-text-dim">Community Perspectives</p>
              </div>
            </div>
            <p className="text-xs text-prism-text-secondary leading-relaxed">
              Social media redesigned around understanding. Why can&apos;t we understand each other?
            </p>
            <p className="text-[10px] text-prism-text-dim mt-2">Version 0.1.0 · prismreason.com</p>
          </div>
        </section>
      </main>
    </div>
  );
}
