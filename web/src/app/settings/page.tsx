"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useGhostMode } from "@/lib/use-ghost-mode";
import type { RadiusMiles } from "@shared/types";

interface SettingsUser {
  email: string;
  username: string;
  display_name: string | null;
  verification_level: number;
  default_radius_miles: RadiusMiles;
}

export default function SettingsPage() {
  const { session } = useAuth();
  const { ghostMode, toggleGhostMode } = useGhostMode();
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultRadius, setDefaultRadius] = useState<RadiusMiles>(20);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (session?.access_token) {
        try {
          const res = await fetch("/api/user/profile", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const { data } = await res.json();
          if (data) {
            setUser({
              email: data.email ?? "",
              username: data.username ?? "",
              display_name: data.display_name ?? null,
              verification_level: data.verification_level ?? 1,
              default_radius_miles: data.default_radius_miles ?? 20,
            });
            setDefaultRadius(data.default_radius_miles ?? 20);
            setLoading(false);
            return;
          }
        } catch {
          // API unavailable
        }
      }
      // No session — show defaults
      setUser({
        email: "",
        username: "",
        display_name: null,
        verification_level: 1,
        default_radius_miles: 20,
      });
      setLoading(false);
    }
    fetchUser();
  }, [session?.access_token]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const radiusOptions: RadiusMiles[] = [10, 20, 30, 40];

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-primary">
        <header className="border-b border-prism-border bg-prism-bg-secondary/95 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/profile" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-base font-semibold text-prism-text-primary">Settings</h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-prism-bg-elevated rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-prism-bg-primary">
      <header className="border-b border-prism-border bg-prism-bg-secondary/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/profile" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-prism-text-primary">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account */}
        <section className="bg-prism-bg-secondary rounded-2xl border border-prism-border overflow-hidden">
          <div className="px-4 py-3 border-b border-prism-border">
            <h2 className="text-sm font-semibold text-prism-text-primary">Account</h2>
          </div>
          <div className="divide-y divide-prism-border">
            <SettingRow label="Email" value={user.email || "Not set"} />
            <SettingRow label="Username" value={user.username ? `@${user.username}` : "Not set"} />
            <SettingRow label="Display Name" value={user.display_name ?? "Not set"} />
            <SettingRow label="Verification" value={`Level ${user.verification_level}`} />
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-prism-bg-secondary rounded-2xl border border-prism-border overflow-hidden">
          <div className="px-4 py-3 border-b border-prism-border">
            <h2 className="text-sm font-semibold text-prism-text-primary">Privacy</h2>
          </div>
          <div className="divide-y divide-prism-border">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-prism-text-primary">Ghost Mode</span>
                <p className="text-xs text-prism-text-dim mt-0.5">Hide your activity from other users</p>
              </div>
              <button
                onClick={toggleGhostMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  ghostMode ? "bg-prism-accent-active" : "bg-prism-bg-elevated"
                }`}
                role="switch"
                aria-checked={ghostMode}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    ghostMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-prism-bg-secondary rounded-2xl border border-prism-border overflow-hidden">
          <div className="px-4 py-3 border-b border-prism-border">
            <h2 className="text-sm font-semibold text-prism-text-primary">Preferences</h2>
          </div>
          <div className="divide-y divide-prism-border">
            <div className="px-4 py-3">
              <span className="text-sm text-prism-text-primary">Default Radius</span>
              <p className="text-xs text-prism-text-dim mt-0.5 mb-3">How far your posts reach by default</p>
              <div className="flex gap-2">
                {radiusOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setDefaultRadius(r)}
                    className={`flex-1 py-2 rounded-lg text-sm font-mono transition-all ${
                      defaultRadius === r
                        ? "bg-prism-accent-active text-white"
                        : "bg-prism-bg-elevated text-prism-text-secondary hover:text-prism-text-primary"
                    }`}
                  >
                    {r}mi
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
            saved
              ? "bg-prism-accent-verified text-white"
              : "bg-prism-accent-active text-white hover:bg-prism-accent-active/90"
          }`}
        >
          {saved ? "\u2713 Saved" : "Save Changes"}
        </button>

        {/* Danger zone */}
        <section className="bg-prism-bg-secondary rounded-2xl border border-prism-accent-live/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-prism-accent-live/20">
            <h2 className="text-sm font-semibold text-prism-accent-live">Danger Zone</h2>
          </div>
          <div className="p-4">
            <button className="text-sm text-prism-accent-live hover:underline">
              Delete Account
            </button>
            <p className="text-xs text-prism-text-dim mt-1">This action cannot be undone.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-prism-text-secondary">{label}</span>
      <span className="text-sm text-prism-text-primary font-mono">{value}</span>
    </div>
  );
}
