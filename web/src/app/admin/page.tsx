"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { CommunityType, TopicStatus } from "@shared/types";

type AdminTab = "communities" | "topics";

interface AdminCommunity {
  id: string;
  name: string;
  region: string;
  country: string;
  community_type: CommunityType;
  color_hex: string;
  description: string | null;
  verified: boolean;
  active: boolean;
  created_at: string;
}

interface AdminTopic {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: TopicStatus;
  perspective_count: number;
  community_count: number;
  created_at: string;
}

const COMMUNITY_TYPE_LABELS: Record<CommunityType, string> = {
  civic: "Civic",
  diaspora: "Diaspora",
  rural: "Rural",
  policy: "Policy",
  academic: "Academic",
  cultural: "Cultural",
};

const STATUS_COLORS: Record<TopicStatus, string> = {
  active: "bg-prism-accent-live/15 text-prism-accent-live",
  trending: "bg-prism-accent-primary/15 text-prism-accent-primary",
  hot: "bg-prism-accent-destructive/15 text-prism-accent-destructive",
  cooling: "bg-prism-text-dim/15 text-prism-text-dim",
  archived: "bg-prism-bg-elevated text-prism-text-dim",
};

export default function AdminPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("communities");
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Topic creation form
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicSummary, setNewTopicSummary] = useState("");
  const [newTopicStatus, setNewTopicStatus] = useState<TopicStatus>("active");

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      h.Authorization = `Bearer ${session.access_token}`;
    }
    return h;
  }, [session?.access_token]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [commRes, topicRes] = await Promise.all([
        fetch("/api/admin/communities", { headers: headers() }),
        fetch("/api/admin/topics", { headers: headers() }),
      ]);

      if (commRes.status === 403 || topicRes.status === 403) {
        setError("You do not have admin access.");
        setLoading(false);
        return;
      }

      const commData = await commRes.json();
      const topicData = await topicRes.json();

      setCommunities(commData.communities ?? []);
      setTopics(topicData.topics ?? []);
    } catch {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (session?.access_token) fetchData();
  }, [session?.access_token, fetchData]);

  const handleCommunityAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/communities", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        if (action === "approve") {
          setCommunities((prev) =>
            prev.map((c) => (c.id === id ? { ...c, active: true } : c))
          );
        } else {
          setCommunities((prev) => prev.filter((c) => c.id !== id));
        }
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    setActionLoading("new-topic");
    try {
      const res = await fetch("/api/admin/topics", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          title: newTopicTitle.trim(),
          summary: newTopicSummary.trim() || undefined,
          status: newTopicStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.topic) {
        setTopics((prev) => [data.topic, ...prev]);
        setNewTopicTitle("");
        setNewTopicSummary("");
        setNewTopicStatus("active");
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleTopicStatusChange = async (id: string, status: TopicStatus) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/topics", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setTopics((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status } : t))
        );
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-prism-bg-base flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display font-bold text-xl text-prism-text-primary mb-2">Admin</h1>
        <p className="text-sm text-prism-text-secondary mb-6">Sign in to access the admin dashboard.</p>
        <Link
          href="/login?redirect=/admin"
          className="px-6 py-2.5 rounded-xl bg-prism-accent-primary text-white font-medium text-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const pendingCommunities = communities.filter((c) => !c.active);
  const activeCommunities = communities.filter((c) => c.active);

  const tabs: { id: AdminTab; label: string; count: number }[] = [
    { id: "communities", label: "Communities", count: pendingCommunities.length },
    { id: "topics", label: "Topics", count: topics.length },
  ];

  return (
    <div className="min-h-screen bg-prism-bg-base">
      <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-prism-text-primary">Admin Dashboard</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {error ? (
          <div className="text-center py-16">
            <p className="text-sm text-prism-accent-destructive">{error}</p>
          </div>
        ) : loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-prism-bg-elevated rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-prism-bg-elevated rounded-full p-1 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-prism-accent-primary text-white"
                      : "text-prism-text-secondary hover:text-prism-text-primary"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="font-mono text-xs opacity-70">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Communities tab */}
            {activeTab === "communities" && (
              <div className="space-y-6">
                {/* Pending */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-accent-primary mb-3">
                    Pending Applications ({pendingCommunities.length})
                  </h2>
                  {pendingCommunities.length > 0 ? (
                    <div className="space-y-2">
                      {pendingCommunities.map((c) => (
                        <div
                          key={c.id}
                          className="bg-prism-bg-surface border border-prism-border rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: c.color_hex }}
                                />
                                <span className="text-sm font-semibold text-prism-text-primary truncate">
                                  {c.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-prism-bg-elevated text-prism-text-dim">
                                  {COMMUNITY_TYPE_LABELS[c.community_type]}
                                </span>
                              </div>
                              <p className="text-xs text-prism-text-secondary mb-1">
                                {c.region}, {c.country}
                              </p>
                              {c.description && (
                                <p className="text-xs text-prism-text-dim leading-relaxed">
                                  {c.description}
                                </p>
                              )}
                              <p className="text-[10px] font-mono text-prism-text-dim mt-2">
                                Applied {new Date(c.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleCommunityAction(c.id, "approve")}
                                disabled={actionLoading === c.id}
                                className="px-3 py-1.5 rounded-lg bg-prism-accent-live/15 text-prism-accent-live text-xs font-medium hover:bg-prism-accent-live/25 transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleCommunityAction(c.id, "reject")}
                                disabled={actionLoading === c.id}
                                className="px-3 py-1.5 rounded-lg bg-prism-accent-destructive/15 text-prism-accent-destructive text-xs font-medium hover:bg-prism-accent-destructive/25 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-prism-text-dim py-6 text-center">
                      No pending applications.
                    </p>
                  )}
                </div>

                {/* Active */}
                {activeCommunities.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-text-dim mb-3">
                      Active Communities ({activeCommunities.length})
                    </h2>
                    <div className="space-y-1">
                      {activeCommunities.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-prism-bg-surface border border-prism-border"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color_hex }}
                          />
                          <span className="text-sm text-prism-text-primary flex-1 truncate">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-prism-text-dim">
                            {c.region}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Topics tab */}
            {activeTab === "topics" && (
              <div className="space-y-6">
                {/* Create topic form */}
                <form onSubmit={handleCreateTopic} className="bg-prism-bg-surface border border-prism-border rounded-xl p-4 space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-accent-primary">
                    Create Topic
                  </h2>
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="Topic title (e.g. Housing Crisis 2026)"
                    maxLength={120}
                    className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50"
                  />
                  <textarea
                    value={newTopicSummary}
                    onChange={(e) => setNewTopicSummary(e.target.value)}
                    placeholder="Brief summary (optional)"
                    rows={2}
                    maxLength={300}
                    className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={newTopicStatus}
                      onChange={(e) => setNewTopicStatus(e.target.value as TopicStatus)}
                      className="px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="trending">Trending</option>
                      <option value="hot">Hot</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!newTopicTitle.trim() || actionLoading === "new-topic"}
                      className="ml-auto px-4 py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === "new-topic" ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>

                {/* Existing topics */}
                {topics.length > 0 ? (
                  <div className="space-y-2">
                    {topics.map((t) => (
                      <div
                        key={t.id}
                        className="bg-prism-bg-surface border border-prism-border rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-prism-text-primary">
                                {t.title}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status]}`}>
                                {t.status.toUpperCase()}
                              </span>
                            </div>
                            {t.summary && (
                              <p className="text-xs text-prism-text-secondary mb-1">{t.summary}</p>
                            )}
                            <p className="text-[10px] font-mono text-prism-text-dim">
                              /{t.slug} &middot; {t.perspective_count} perspectives &middot; {t.community_count} communities
                            </p>
                          </div>
                          <select
                            value={t.status}
                            onChange={(e) => handleTopicStatusChange(t.id, e.target.value as TopicStatus)}
                            disabled={actionLoading === t.id}
                            className="px-2 py-1 rounded-lg bg-prism-bg-base border border-prism-border text-xs text-prism-text-secondary focus:outline-none disabled:opacity-50"
                          >
                            <option value="active">Active</option>
                            <option value="trending">Trending</option>
                            <option value="hot">Hot</option>
                            <option value="cooling">Cooling</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-prism-text-dim py-6 text-center">
                    No topics yet. Create one above.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
