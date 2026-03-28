"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { CommunityType, TopicStatus } from "@shared/types";

type AdminTab = "communities" | "topics" | "reports" | "prompts" | "perspectives" | "push" | "tools";

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

type ReportContentType = "perspective" | "post" | "community";
type ReportReason = "harassment" | "misinformation" | "spam" | "hate_speech" | "other";

interface AdminReport {
  id: string;
  reporter_id: string;
  content_type: ReportContentType;
  content_id: string;
  reason: ReportReason;
  details: string | null;
  status: string;
  created_at: string;
}

const CONTENT_TYPE_COLORS: Record<ReportContentType, string> = {
  perspective: "bg-prism-accent-primary/15 text-prism-accent-primary",
  post: "bg-blue-500/15 text-blue-400",
  community: "bg-purple-500/15 text-purple-400",
};

const REASON_COLORS: Record<ReportReason, string> = {
  harassment: "bg-prism-accent-destructive/15 text-prism-accent-destructive",
  misinformation: "bg-yellow-500/15 text-yellow-400",
  spam: "bg-prism-text-dim/15 text-prism-text-dim",
  hate_speech: "bg-red-600/15 text-red-400",
  other: "bg-prism-bg-elevated text-prism-text-secondary",
};

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

interface AdminPrompt {
  id: string;
  prompt_text: string;
  description: string | null;
  active: boolean;
  topic_id: string | null;
  topic: { title: string; slug: string } | null;
  starts_at: string;
  created_at: string;
}

const COMMUNITY_TYPE_DEFAULTS: Record<CommunityType, string> = {
  civic: "#3B82F6",
  diaspora: "#A855F7",
  rural: "#F59E0B",
  policy: "#22C55E",
  academic: "#06B6D4",
  cultural: "#F97316",
};

export default function AdminPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("communities");
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [prompts, setPrompts] = useState<AdminPrompt[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [promptsLoaded, setPromptsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Topic creation form
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicSummary, setNewTopicSummary] = useState("");
  const [newTopicStatus, setNewTopicStatus] = useState<TopicStatus>("active");

  // Community creation form
  const [newCommName, setNewCommName] = useState("");
  const [newCommRegion, setNewCommRegion] = useState("");
  const [newCommCountry, setNewCommCountry] = useState("");
  const [newCommType, setNewCommType] = useState<CommunityType>("civic");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [newCommLat, setNewCommLat] = useState("");
  const [newCommLng, setNewCommLng] = useState("");

  // Prompt creation form
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptDesc, setNewPromptDesc] = useState("");
  const [newPromptTopicId, setNewPromptTopicId] = useState("");
  const [newPromptActive, setNewPromptActive] = useState(false);

  // Perspective creation form
  const [newPerspQuote, setNewPerspQuote] = useState("");
  const [newPerspContext, setNewPerspContext] = useState("");
  const [newPerspCommunityId, setNewPerspCommunityId] = useState("");
  const [newPerspTopicId, setNewPerspTopicId] = useState("");

  // Push notification form
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/feed");
  const [pushCommunityId, setPushCommunityId] = useState("");
  const [pushResult, setPushResult] = useState("");

  // Digest preview
  const [digestPreview, setDigestPreview] = useState("");
  const [digestLoading, setDigestLoading] = useState(false);

  // User promote
  const [promoteUserId, setPromoteUserId] = useState("");
  const [promoteResult, setPromoteResult] = useState("");

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

  const fetchReports = useCallback(async () => {
    if (reportsLoaded) return;
    setReportsLoading(true);
    try {
      const res = await fetch("/api/admin/reports", { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports ?? []);
        setReportsLoaded(true);
      }
    } catch {
      // silent
    } finally {
      setReportsLoading(false);
    }
  }, [headers, reportsLoaded]);

  useEffect(() => {
    if (session?.access_token) fetchData();
  }, [session?.access_token, fetchData]);

  const fetchPrompts = useCallback(async () => {
    if (promptsLoaded) return;
    try {
      const res = await fetch("/api/admin/prompts", { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setPrompts(data.prompts ?? []);
        setPromptsLoaded(true);
      }
    } catch {
      // silent
    }
  }, [headers, promptsLoaded]);

  useEffect(() => {
    if (activeTab === "reports" && session?.access_token && !reportsLoaded) {
      fetchReports();
    }
    if (activeTab === "prompts" && session?.access_token && !promptsLoaded) {
      fetchPrompts();
    }
  }, [activeTab, session?.access_token, reportsLoaded, fetchReports, promptsLoaded, fetchPrompts]);

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
        showSuccess(`Created topic: ${data.topic.title}`);
      } else {
        showError(data.error ?? "Failed to create topic");
      }
    } catch {
      showError("Network error — check your connection");
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

  const handleReportAction = async (id: string, status: "dismissed" | "actioned") => {
    // Optimistic removal
    setReports((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id, status }),
      });
    } catch {
      // Re-fetch on error to restore state
      setReportsLoaded(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage("");
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const handleAiSuggestSummary = async () => {
    if (!newTopicTitle.trim()) return;
    setAiLoading("suggest-summary");
    try {
      const res = await fetch("/api/admin/ai/suggest-summary", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ title: newTopicTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setNewTopicSummary(data.summary);
        showSuccess("AI summary generated");
      } else {
        showError(data.error ?? "Failed to generate summary");
      }
    } catch {
      showError("Network error — check your connection");
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiSuggestPrompts = async () => {
    const topicTitle = newPromptTopicId
      ? topics.find((t) => t.id === newPromptTopicId)?.title ?? ""
      : newPromptText.trim();
    if (!topicTitle) {
      showError("Select a topic or enter prompt text first");
      return;
    }
    setAiLoading("suggest-prompts");
    try {
      const res = await fetch("/api/admin/ai/suggest-prompts", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ topicTitle, count: 3 }),
      });
      const data = await res.json();
      if (res.ok && data.prompts?.length) {
        setNewPromptText(data.prompts[0]);
        setNewPromptDesc(data.prompts.slice(1).join("\n"));
        showSuccess(`AI suggested ${data.prompts.length} prompts`);
      } else {
        showError(data.error ?? "Failed to generate prompts");
      }
    } catch {
      showError("Network error — check your connection");
    } finally {
      setAiLoading(null);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim() || !newCommRegion.trim() || !newCommCountry.trim()) return;
    setActionLoading("new-community");
    try {
      const res = await fetch("/api/admin/communities", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: newCommName.trim(),
          region: newCommRegion.trim(),
          country: newCommCountry.trim(),
          community_type: newCommType,
          color_hex: COMMUNITY_TYPE_DEFAULTS[newCommType],
          description: newCommDesc.trim() || undefined,
          lat: newCommLat ? parseFloat(newCommLat) : undefined,
          lng: newCommLng ? parseFloat(newCommLng) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.community) {
        setCommunities((prev) => [data.community, ...prev]);
        setNewCommName(""); setNewCommRegion(""); setNewCommCountry("");
        setNewCommType("civic"); setNewCommDesc(""); setNewCommLat(""); setNewCommLng("");
        showSuccess(`Created community: ${data.community.name}`);
      } else {
        showError(data.error ?? "Failed to create community");
      }
    } catch { showError("Network error — check your connection"); } finally { setActionLoading(null); }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;
    setActionLoading("new-prompt");
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          prompt_text: newPromptText.trim(),
          description: newPromptDesc.trim() || undefined,
          topic_id: newPromptTopicId || undefined,
          active: newPromptActive,
        }),
      });
      const data = await res.json();
      if (res.ok && data.prompt) {
        if (newPromptActive) {
          setPrompts((prev) => [data.prompt, ...prev.map((p: AdminPrompt) => ({ ...p, active: false }))]);
        } else {
          setPrompts((prev) => [data.prompt, ...prev]);
        }
        setNewPromptText(""); setNewPromptDesc(""); setNewPromptTopicId(""); setNewPromptActive(false);
        showSuccess("Prompt created");
      } else {
        showError(data.error ?? "Failed to create prompt");
      }
    } catch { showError("Network error — check your connection"); } finally { setActionLoading(null); }
  };

  const handleTogglePrompt = async (id: string, active: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id, active }),
      });
      if (res.ok) {
        setPrompts((prev) =>
          prev.map((p) => {
            if (p.id === id) return { ...p, active };
            if (active) return { ...p, active: false };
            return p;
          })
        );
      }
    } catch { /* silent */ } finally { setActionLoading(null); }
  };

  const handleCreatePerspective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerspQuote.trim() || newPerspQuote.trim().length < 20 || !newPerspCommunityId || !newPerspTopicId) return;
    setActionLoading("new-perspective");
    try {
      const res = await fetch("/api/admin/perspectives", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          quote: newPerspQuote.trim(),
          context: newPerspContext.trim() || undefined,
          community_id: newPerspCommunityId,
          topic_id: newPerspTopicId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.perspective) {
        setNewPerspQuote(""); setNewPerspContext(""); setNewPerspCommunityId(""); setNewPerspTopicId("");
        showSuccess("Perspective created");
      } else {
        showError(data.error ?? "Failed to create perspective");
      }
    } catch { showError("Network error — check your connection"); } finally { setActionLoading(null); }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) return;
    setActionLoading("send-push");
    setPushResult("");
    try {
      const res = await fetch("/api/admin/send-push", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          title: pushTitle.trim(),
          body: pushBody.trim(),
          url: pushUrl.trim() || "/feed",
          community_id: pushCommunityId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPushResult(`Sent to ${data.sent} subscriber(s)`);
        setPushTitle(""); setPushBody(""); setPushUrl("/feed"); setPushCommunityId("");
      } else {
        setPushResult(`Error: ${data.error ?? "Failed"}`);
      }
    } catch { setPushResult("Network error"); } finally { setActionLoading(null); }
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
    { id: "prompts", label: "Prompts", count: prompts.filter((p) => p.active).length },
    { id: "perspectives", label: "Perspectives", count: 0 },
    { id: "push", label: "Push", count: 0 },
    { id: "tools", label: "Tools", count: 0 },
    { id: "reports", label: "Reports", count: reports.filter((r) => r.status === "pending").length },
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
            {/* Success toast */}
            {successMessage && (
              <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-prism-accent-live/90 text-white text-sm font-medium shadow-lg animate-fade-in">
                {successMessage}
              </div>
            )}

            {/* Error toast */}
            {errorMessage && (
              <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-prism-accent-destructive/90 text-white text-sm font-medium shadow-lg animate-fade-in">
                {errorMessage}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-prism-bg-elevated rounded-full p-1 mb-6 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-prism-accent-primary text-white"
                      : "text-prism-text-secondary hover:text-prism-text-primary"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="font-mono text-[10px] opacity-70">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Communities tab */}
            {activeTab === "communities" && (
              <div className="space-y-6">
                {/* Create community form */}
                <form onSubmit={handleCreateCommunity} className="bg-prism-bg-surface border border-prism-border rounded-xl p-4 space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-accent-primary">
                    Create Community
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={newCommName} onChange={(e) => setNewCommName(e.target.value)}
                      placeholder="Community name" maxLength={200}
                      className="col-span-2 w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50" />
                    <input type="text" value={newCommRegion} onChange={(e) => setNewCommRegion(e.target.value)}
                      placeholder="Region (e.g. South Side Chicago)" maxLength={200}
                      className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50" />
                    <input type="text" value={newCommCountry} onChange={(e) => setNewCommCountry(e.target.value)}
                      placeholder="Country" maxLength={100}
                      className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50" />
                    <select value={newCommType} onChange={(e) => setNewCommType(e.target.value as CommunityType)}
                      className="px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary focus:outline-none">
                      {(Object.keys(COMMUNITY_TYPE_LABELS) as CommunityType[]).map((t) => (
                        <option key={t} value={t}>{COMMUNITY_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input type="text" value={newCommLat} onChange={(e) => setNewCommLat(e.target.value)}
                        placeholder="Lat" className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none" />
                      <input type="text" value={newCommLng} onChange={(e) => setNewCommLng(e.target.value)}
                        placeholder="Lng" className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none" />
                    </div>
                  </div>
                  <textarea value={newCommDesc} onChange={(e) => setNewCommDesc(e.target.value)}
                    placeholder="Description (optional)" rows={2} maxLength={500}
                    className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 resize-none" />
                  <button type="submit" disabled={!newCommName.trim() || !newCommRegion.trim() || !newCommCountry.trim() || actionLoading === "new-community"}
                    className="px-4 py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionLoading === "new-community" ? "Creating..." : "Create Community"}
                  </button>
                </form>

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
                  <div className="relative">
                    <textarea
                      value={newTopicSummary}
                      onChange={(e) => setNewTopicSummary(e.target.value)}
                      placeholder="Brief summary (optional)"
                      rows={2}
                      maxLength={300}
                      className="w-full px-3 py-2 pr-28 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleAiSuggestSummary}
                      disabled={!newTopicTitle.trim() || aiLoading === "suggest-summary"}
                      className="absolute top-2 right-2 px-2 py-1 rounded-md bg-prism-bg-elevated border border-prism-border text-[10px] font-medium text-prism-accent-primary hover:bg-prism-bg-overlay transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiLoading === "suggest-summary" ? "Thinking..." : "Suggest with AI"}
                    </button>
                  </div>
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

            {/* Reports tab */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-accent-primary">
                  Pending Reports ({reports.filter((r) => r.status === "pending").length})
                </h2>
                {reportsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-prism-bg-elevated rounded-xl animate-shimmer" />
                    ))}
                  </div>
                ) : reports.filter((r) => r.status === "pending").length > 0 ? (
                  <div className="space-y-2">
                    {reports
                      .filter((r) => r.status === "pending")
                      .map((r) => (
                        <div
                          key={r.id}
                          className="bg-prism-bg-surface border border-prism-border rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CONTENT_TYPE_COLORS[r.content_type]}`}>
                                  {r.content_type.toUpperCase()}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${REASON_COLORS[r.reason]}`}>
                                  {r.reason.replace("_", " ").toUpperCase()}
                                </span>
                              </div>
                              {r.details && (
                                <p className="text-xs text-prism-text-secondary mb-2 leading-relaxed">
                                  {r.details}
                                </p>
                              )}
                              <p className="text-[10px] font-mono text-prism-text-dim">
                                {r.content_id.slice(0, 8)}&hellip; &middot; {new Date(r.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleReportAction(r.id, "dismissed")}
                                className="px-3 py-1.5 rounded-lg bg-prism-text-dim/15 text-prism-text-secondary text-xs font-medium hover:bg-prism-text-dim/25 transition-colors"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleReportAction(r.id, "actioned")}
                                className="px-3 py-1.5 rounded-lg bg-prism-accent-destructive/15 text-prism-accent-destructive text-xs font-medium hover:bg-prism-accent-destructive/25 transition-colors"
                              >
                                Action
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-prism-text-dim py-6 text-center">
                    No pending reports.
                  </p>
                )}
              </div>
            )}

            {/* Prompts tab */}
            {activeTab === "prompts" && (
              <div className="space-y-6">
                <form onSubmit={handleCreatePrompt} className="bg-prism-bg-surface border border-prism-border rounded-xl p-4 space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-accent-primary">
                    Create Perspective Prompt
                  </h2>
                  <input type="text" value={newPromptText} onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="Prompt text (e.g. How is your community experiencing the housing crisis?)"
                    maxLength={500}
                    className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50" />
                  <textarea value={newPromptDesc} onChange={(e) => setNewPromptDesc(e.target.value)}
                    placeholder="Description (optional context for contributors)" rows={2} maxLength={500}
                    className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 resize-none" />
                  <div className="flex items-center gap-3 flex-wrap">
                    <select value={newPromptTopicId} onChange={(e) => setNewPromptTopicId(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary focus:outline-none">
                      <option value="">No topic</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                    <button type="button" onClick={handleAiSuggestPrompts}
                      disabled={aiLoading === "suggest-prompts"}
                      className="px-2 py-1 rounded-md bg-prism-bg-elevated border border-prism-border text-[10px] font-medium text-prism-accent-primary hover:bg-prism-bg-overlay transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {aiLoading === "suggest-prompts" ? "Thinking..." : "Suggest with AI"}
                    </button>
                    <label className="flex items-center gap-2 text-sm text-prism-text-secondary cursor-pointer">
                      <input type="checkbox" checked={newPromptActive} onChange={(e) => setNewPromptActive(e.target.checked)}
                        className="w-4 h-4 rounded accent-prism-accent-primary" />
                      Set active
                    </label>
                    <button type="submit" disabled={!newPromptText.trim() || actionLoading === "new-prompt"}
                      className="ml-auto px-4 py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                      {actionLoading === "new-prompt" ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>

                {prompts.length > 0 ? (
                  <div className="space-y-2">
                    {prompts.map((p) => (
                      <div key={p.id} className="bg-prism-bg-surface border border-prism-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-prism-text-primary mb-1">{p.prompt_text}</p>
                            {p.description && <p className="text-xs text-prism-text-dim mb-1">{p.description}</p>}
                            <div className="flex items-center gap-2">
                              {p.active && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-prism-accent-live/15 text-prism-accent-live font-medium">ACTIVE</span>
                              )}
                              {p.topic && (
                                <span className="text-[10px] text-prism-text-dim">Topic: {p.topic.title}</span>
                              )}
                              <span className="text-[10px] font-mono text-prism-text-dim">
                                {new Date(p.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleTogglePrompt(p.id, !p.active)}
                            disabled={actionLoading === p.id}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                              p.active
                                ? "bg-prism-accent-destructive/15 text-prism-accent-destructive hover:bg-prism-accent-destructive/25"
                                : "bg-prism-accent-live/15 text-prism-accent-live hover:bg-prism-accent-live/25"
                            }`}>
                            {p.active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-prism-text-dim py-6 text-center">No prompts yet.</p>
                )}
              </div>
            )}

            {/* Perspectives tab */}
            {activeTab === "perspectives" && (
              <div className="space-y-6">
                <form onSubmit={handleCreatePerspective} className="bg-prism-bg-surface border border-prism-border rounded-xl p-4 space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-accent-primary">
                    Create Perspective
                  </h2>
                  <textarea value={newPerspQuote} onChange={(e) => setNewPerspQuote(e.target.value)}
                    placeholder="Perspective quote (20–500 chars, the actual community voice)" rows={3} maxLength={500} minLength={20}
                    className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 resize-none" />
                  <input type="text" value={newPerspContext} onChange={(e) => setNewPerspContext(e.target.value)}
                    placeholder="Context (optional, e.g. spoken at a town hall)" maxLength={300}
                    className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newPerspCommunityId} onChange={(e) => setNewPerspCommunityId(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary focus:outline-none">
                      <option value="">Select community</option>
                      {communities.filter((c) => c.active).map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.region})</option>
                      ))}
                    </select>
                    <select value={newPerspTopicId} onChange={(e) => setNewPerspTopicId(e.target.value)}
                      required
                      className="px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary focus:outline-none">
                      <option value="">Select topic (required)</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit"
                    disabled={!newPerspQuote.trim() || newPerspQuote.trim().length < 20 || !newPerspCommunityId || !newPerspTopicId || actionLoading === "new-perspective"}
                    className="px-4 py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionLoading === "new-perspective" ? "Creating..." : "Create Perspective"}
                  </button>
                </form>
                <p className="text-xs text-prism-text-dim text-center">
                  Perspectives created here are auto-verified and will appear on the map and feeds immediately.
                </p>
              </div>
            )}

            {/* Push tab */}
            {activeTab === "push" && (
              <div className="space-y-6">
                <form onSubmit={handleSendPush} className="bg-prism-bg-surface border border-prism-border rounded-xl p-4 space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-accent-primary">
                    Send Push Notification
                  </h2>
                  <input type="text" value={pushTitle} onChange={(e) => setPushTitle(e.target.value)}
                    placeholder="Notification title" maxLength={200}
                    className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50" />
                  <textarea value={pushBody} onChange={(e) => setPushBody(e.target.value)}
                    placeholder="Notification body" rows={2} maxLength={500}
                    className="w-full px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 resize-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={pushUrl} onChange={(e) => setPushUrl(e.target.value)}
                      placeholder="URL (default: /feed)"
                      className="px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none" />
                    <select value={pushCommunityId} onChange={(e) => setPushCommunityId(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary focus:outline-none">
                      <option value="">All users (broadcast)</option>
                      {communities.filter((c) => c.active).map((c) => (
                        <option key={c.id} value={c.id}>{c.name} followers</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={!pushTitle.trim() || !pushBody.trim() || actionLoading === "send-push"}
                      className="px-4 py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                      {actionLoading === "send-push" ? "Sending..." : "Send Push"}
                    </button>
                    {pushResult && (
                      <span className="text-xs text-prism-text-secondary">{pushResult}</span>
                    )}
                  </div>
                </form>
                <p className="text-xs text-prism-text-dim text-center">
                  Automated hourly notifications are already configured for new perspectives via cron.
                </p>
              </div>
            )}

            {/* Tools tab — digest preview + user promote */}
            {activeTab === "tools" && (
              <div className="space-y-6">
                {/* Digest Preview */}
                <div className="bg-prism-bg-surface border border-prism-border rounded-xl p-4 space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-accent-primary">
                    Preview Weekly Digest
                  </h2>
                  <p className="text-xs text-prism-text-dim">
                    Generate the current weekly digest without sending it. Uses the Claude API.
                  </p>
                  <button
                    onClick={async () => {
                      setDigestLoading(true);
                      setDigestPreview("");
                      try {
                        const res = await fetch("/api/admin/digest", {
                          method: "POST",
                          headers: headers(),
                        });
                        const data = await res.json();
                        setDigestPreview(data.digest ?? data.error ?? "No digest generated");
                      } catch {
                        setDigestPreview("Failed to generate digest");
                      } finally {
                        setDigestLoading(false);
                      }
                    }}
                    disabled={digestLoading}
                    className="px-4 py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {digestLoading ? "Generating..." : "Generate Preview"}
                  </button>
                  {digestPreview && (
                    <div className="mt-3 p-4 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-secondary whitespace-pre-line leading-relaxed">
                      {digestPreview}
                    </div>
                  )}
                </div>

                {/* User Promote */}
                <div className="bg-prism-bg-surface border border-prism-border rounded-xl p-4 space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-prism-accent-primary">
                    Promote User to Level 3
                  </h2>
                  <p className="text-xs text-prism-text-dim">
                    Manually promote a Level 2 user to Level 3 (verified contributor). Requires the user ID.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoteUserId}
                      onChange={(e) => setPromoteUserId(e.target.value)}
                      placeholder="User UUID"
                      className="flex-1 px-3 py-2 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        if (!promoteUserId.trim()) return;
                        setPromoteResult("");
                        try {
                          const res = await fetch("/api/admin/users/promote", {
                            method: "POST",
                            headers: headers(),
                            body: JSON.stringify({ user_id: promoteUserId.trim(), level: 3 }),
                          });
                          const data = await res.json();
                          setPromoteResult(data.message ?? data.error ?? "Done");
                        } catch {
                          setPromoteResult("Failed");
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-prism-accent-live text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Promote
                    </button>
                  </div>
                  {promoteResult && (
                    <p className="text-xs text-prism-text-secondary">{promoteResult}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
