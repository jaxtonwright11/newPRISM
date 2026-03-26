"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/use-realtime";
import type { Notification } from "@shared/types";

function NotifIcon({ type }: { type: Notification["type"] }) {
  const base = "w-5 h-5";
  switch (type) {
    case "reaction":
      return <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>;
    case "connection_request":
      return <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>;
    case "connection_accepted":
      return <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case "new_perspective":
      return <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>;
    case "community_milestone":
      return <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
  }
}

const NOTIF_COLORS: Record<Notification["type"], string> = {
  reaction: "bg-prism-accent-primary/10 text-prism-accent-primary",
  connection_request: "bg-prism-community-diaspora/10 text-prism-community-diaspora",
  connection_accepted: "bg-prism-accent-live/10 text-prism-accent-live",
  new_perspective: "bg-prism-community-cultural/10 text-prism-community-cultural",
  community_milestone: "bg-prism-accent-primary/10 text-prism-accent-primary",
};

export default function NotificationsPage() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real notifications
  useEffect(() => {
    async function fetchNotifications() {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      try {
        const res = await fetch("/api/notifications", { headers });
        const json = await res.json();
        if (json.data) setNotifications(json.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [session?.access_token]);

  // Live notifications via Realtime
  useRealtime({
    table: "notifications",
    event: "INSERT",
    onInsert: useCallback((payload: Record<string, unknown>) => {
      if (payload.id) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === payload.id)) return prev;
          return [payload as unknown as Notification, ...prev];
        });
      }
    }, []),
    enabled: !!session,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!session?.access_token) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
    } catch {
      // silent
    }
  };

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (!session?.access_token) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "mark_read", id }),
      });
    } catch {
      // silent
    }
  };

  const formatTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-prism-bg-base">
      <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-base font-semibold text-prism-text-primary">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-mono bg-prism-accent-live/20 text-prism-accent-live px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-prism-accent-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-1 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-prism-bg-elevated animate-shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-prism-bg-elevated rounded-full w-3/4 animate-shimmer" />
                  <div className="h-2.5 bg-prism-bg-elevated rounded-full w-1/2 animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-prism-border">
            {notifications.map((notif) => {
              return (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`w-full text-left px-4 py-4 flex items-start gap-3 transition-colors ${
                    notif.read ? "opacity-60" : "bg-prism-accent-primary/[0.03]"
                  } hover:bg-prism-bg-elevated`}
                >
                  <div className={`w-10 h-10 rounded-full ${NOTIF_COLORS[notif.type]} flex items-center justify-center shrink-0`}>
                    <NotifIcon type={notif.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-prism-text-primary">{notif.title}</span>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-prism-accent-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-prism-text-secondary mt-0.5 leading-relaxed">{notif.body}</p>
                    <span className="text-[10px] text-prism-text-dim font-mono mt-1 block">{formatTime(notif.created_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-prism-bg-elevated flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <p className="text-sm text-prism-text-dim">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
