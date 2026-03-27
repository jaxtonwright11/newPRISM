"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useGhostMode } from "@/lib/use-ghost-mode";
import type { RadiusMiles } from "@shared/types";

interface SettingsUser {
  email: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  verification_level: number;
  default_radius_miles: RadiusMiles;
}

export default function SettingsPage() {
  const { session, signOut } = useAuth();
  const { ghostMode, toggleGhostMode } = useGhostMode();
  const router = useRouter();
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [defaultRadius, setDefaultRadius] = useState<RadiusMiles>(20);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (session?.access_token) {
        try {
          const res = await fetch("/api/user/profile", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const { data } = await res.json();
          if (data) {
            const profile = Array.isArray(data.profile) ? data.profile[0] : data.profile;
            setUser({
              email: data.email ?? "",
              username: data.username ?? "",
              display_name: data.display_name ?? null,
              bio: profile?.bio ?? null,
              verification_level: data.verification_level ?? 1,
              default_radius_miles: data.default_radius_miles ?? 20,
            });
            setDisplayName(data.display_name ?? "");
            setBio(profile?.bio ?? "");
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
        bio: null,
        verification_level: 1,
        default_radius_miles: 20,
      });
      setLoading(false);
    }
    fetchUser();
  }, [session?.access_token]);

  const handleSave = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (displayName.trim()) payload.display_name = displayName.trim();
      if (bio !== (user?.bio ?? "")) payload.bio = bio.trim();

      if (Object.keys(payload).length > 0) {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const radiusOptions: RadiusMiles[] = [10, 20, 30, 40];

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-base">
        <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
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
    <div className="min-h-screen bg-prism-bg-base">
      <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
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
        <section className="bg-prism-bg-surface rounded-2xl border border-prism-border overflow-hidden">
          <div className="px-4 py-3 border-b border-prism-border">
            <h2 className="text-sm font-semibold text-prism-text-primary">Account</h2>
          </div>
          <div className="divide-y divide-prism-border">
            <SettingRow label="Email" value={user.email || "Not set"} />
            <SettingRow label="Username" value={user.username ? `@${user.username}` : "Not set"} />
            <div className="px-4 py-3">
              <label className="text-sm text-prism-text-secondary block mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                placeholder="Your display name"
                className="w-full px-3 py-2 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50"
              />
            </div>
            <div className="px-4 py-3">
              <label className="text-sm text-prism-text-secondary block mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                placeholder="Tell people about yourself"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 resize-none"
              />
              <span className="text-[10px] text-prism-text-dim font-mono mt-1 block text-right">{bio.length}/160</span>
            </div>
            <SettingRow label="Verification" value={`Level ${user.verification_level}`} />
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-prism-bg-surface rounded-2xl border border-prism-border overflow-hidden">
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
                  ghostMode ? "bg-prism-accent-primary" : "bg-prism-bg-elevated"
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
        <section className="bg-prism-bg-surface rounded-2xl border border-prism-border overflow-hidden">
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
                        ? "bg-prism-accent-primary text-white"
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
              ? "bg-prism-accent-live text-white"
              : "bg-prism-accent-primary text-white hover:bg-prism-accent-primary/90"
          }`}
        >
          {saved ? "\u2713 Saved" : saving ? "Saving..." : "Save Changes"}
        </button>

        {/* Change Password */}
        <section className="bg-prism-bg-surface rounded-2xl border border-prism-border overflow-hidden">
          <div className="px-4 py-3 border-b border-prism-border">
            <h2 className="text-sm font-semibold text-prism-text-primary">Security</h2>
          </div>
          <div className="p-4">
            <Link
              href="/forgot-password"
              className="text-sm text-prism-accent-primary hover:underline"
            >
              Change password →
            </Link>
            <p className="text-xs text-prism-text-dim mt-1">We&apos;ll send a reset link to your email.</p>
          </div>
        </section>

        {/* Sign Out */}
        <button
          onClick={async () => {
            await signOut();
            router.push("/landing");
          }}
          className="w-full py-3 rounded-xl bg-prism-bg-surface border border-prism-border text-sm text-prism-text-secondary hover:text-prism-text-primary hover:border-prism-text-dim/30 transition-all"
        >
          Sign out
        </button>

        {/* Danger zone */}
        <section className="bg-prism-bg-surface rounded-2xl border border-prism-accent-destructive/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-prism-accent-destructive/20">
            <h2 className="text-sm font-semibold text-prism-accent-destructive">Danger Zone</h2>
          </div>
          <div className="p-4">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                  // TODO: wire to account deletion API
                  alert("Please contact support to delete your account.");
                }
              }}
              className="text-sm text-prism-accent-destructive hover:underline"
            >
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
