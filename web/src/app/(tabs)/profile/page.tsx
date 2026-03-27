"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { EmptyState, EMPTY_STATES } from "@/components/empty-state";
import { getStreak, getStreakMessage } from "@/lib/streak";

type ProfileTab = "perspectives" | "connections" | "saved" | "settings";

interface UserPost {
  id: string;
  content: string;
  post_type: string;
  created_at: string;
}

interface Connection {
  id: string;
  status: string;
  requester_id: string;
  recipient_id: string;
  intro_message: string;
  created_at: string;
  requester: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  recipient: { id: string; username: string; display_name: string | null; avatar_url: string | null };
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
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [followedCount, setFollowedCount] = useState(0);

  // Initialize streak from localStorage, then sync from server
  useEffect(() => {
    const local = getStreak();
    setStreak(local.count);
    setStreakMessage(getStreakMessage(local.count));
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
          setJoinedAt(data.data.created_at ?? null);
          const profile = Array.isArray(data.data.profile) ? data.data.profile[0] : data.data.profile;
          setBio(profile?.bio ?? null);
          // Sync streak from server (source of truth)
          if (profile?.streak_count != null && profile.streak_count > 0) {
            const serverStreak = profile.streak_count as number;
            setStreak(serverStreak);
            setStreakMessage(getStreakMessage(serverStreak));
            // Update localStorage to match server
            if (profile.streak_last_date) {
              localStorage.setItem("prism_streak", JSON.stringify({
                count: serverStreak,
                lastPostDate: profile.streak_last_date,
              }));
            }
          }
        }
      })
      .catch(() => {});

    fetch("/api/communities/follow", { headers })
      .then((res) => res.json())
      .then((data) => setFollowedCount(data.follows?.length ?? 0))
      .catch(() => {});

    fetch("/api/posts?own=true", { headers })
      .then((res) => res.json())
      .then((data) => setUserPosts(data.posts ?? data.data ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));

    fetch("/api/connections", { headers })
      .then((res) => res.json())
      .then((data) => setConnections(data.data ?? []))
      .catch(() => {})
      .finally(() => setConnectionsLoading(false));
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

  const pendingCount = connections.filter(
    (c) => c.status === "pending" && c.recipient_id === user?.id
  ).length;

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "perspectives", label: "My Perspectives" },
    { id: "connections", label: pendingCount > 0 ? `Connections (${pendingCount})` : "Connections" },
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

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="text-center">
            <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{userPosts.length}</span>
            <p className="text-[10px] text-[var(--text-dim)]">Posts</p>
          </div>
          <div className="text-center">
            <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{followedCount}</span>
            <p className="text-[10px] text-[var(--text-dim)]">Communities</p>
          </div>
          <div className="text-center">
            <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{connections.filter((c) => c.status === "accepted").length}</span>
            <p className="text-[10px] text-[var(--text-dim)]">Connections</p>
          </div>
          {/* Founding Voice badge — shown for users who joined before launch */}
          {joinedAt && new Date(joinedAt) < new Date("2026-06-01") && (
            <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
              <svg className="w-3 h-3 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-medium text-[var(--accent-primary)]">Founding Voice</span>
            </div>
          )}
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
        {activeTab === "connections" && (
          connectionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-[var(--bg-elevated)] rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : connections.length > 0 ? (
            <div className="space-y-3">
              {/* Pending requests first */}
              {connections
                .filter((c) => c.status === "pending" && c.recipient_id === user?.id)
                .map((c) => {
                  const other = c.requester;
                  return (
                    <div key={c.id} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--accent-primary)]/20 p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-bold text-[var(--accent-primary)]">
                          {(other.display_name || other.username)?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {other.display_name || other.username}
                          </p>
                          <p className="text-xs text-[var(--text-dim)]">Wants to connect</p>
                        </div>
                      </div>
                      {c.intro_message && (
                        <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">&ldquo;{c.intro_message}&rdquo;</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!session?.access_token) return;
                            setConnections((prev) => prev.map((conn) => conn.id === c.id ? { ...conn, status: "accepted" } : conn));
                            try {
                              await fetch(`/api/connections/${c.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                                body: JSON.stringify({ status: "accepted" }),
                              });
                            } catch {
                              setConnections((prev) => prev.map((conn) => conn.id === c.id ? { ...conn, status: "pending" } : conn));
                            }
                          }}
                          className="flex-1 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={async () => {
                            if (!session?.access_token) return;
                            setConnections((prev) => prev.map((conn) => conn.id === c.id ? { ...conn, status: "declined" } : conn));
                            try {
                              await fetch(`/api/connections/${c.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                                body: JSON.stringify({ status: "declined" }),
                              });
                            } catch {
                              setConnections((prev) => prev.map((conn) => conn.id === c.id ? { ...conn, status: "pending" } : conn));
                            }
                          }}
                          className="flex-1 py-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              {/* Accepted connections */}
              {connections
                .filter((c) => c.status === "accepted")
                .map((c) => {
                  const other = c.requester_id === user?.id ? c.recipient : c.requester;
                  return (
                    <Link key={c.id} href={`/profile/${other.id}`} className="flex items-center gap-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-elevated)] p-4 hover:border-[var(--accent-primary)]/30 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-bold text-[var(--accent-primary)]">
                        {(other.display_name || other.username)?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{other.display_name || other.username}</p>
                        <p className="text-xs text-[var(--text-dim)]">Connected</p>
                      </div>
                      <svg className="w-4 h-4 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" /></svg>
                    </Link>
                  );
                })}
              {/* Pending sent */}
              {connections
                .filter((c) => c.status === "pending" && c.requester_id === user?.id)
                .map((c) => {
                  const other = c.recipient;
                  return (
                    <div key={c.id} className="flex items-center gap-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-elevated)] p-4 opacity-60">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-bold text-[var(--text-dim)]">
                        {(other.display_name || other.username)?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{other.display_name || other.username}</p>
                        <p className="text-xs text-[var(--text-dim)]">Request sent</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-2">No connections yet</p>
              <p className="text-xs text-[var(--text-dim)]">Connect with people from other communities to see the world differently.</p>
            </div>
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
            <Link
              href="/apply"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] font-body text-sm"
            >
              Register a Community
              <svg className="w-4 h-4 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/settings#invite"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] font-body text-sm"
            >
              Invite Friends
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
