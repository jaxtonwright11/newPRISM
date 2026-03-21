"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/use-realtime";
import type { Notification } from "@shared/types";

const NOTIF_ICONS: Record<Notification["type"], { emoji: string; color: string }> = {
  reaction: { emoji: "💡", color: "bg-prism-accent-active/10" },
  connection_request: { emoji: "🤝", color: "bg-prism-community-diaspora/10" },
  connection_accepted: { emoji: "✓", color: "bg-prism-accent-verified/10" },
  new_perspective: { emoji: "📝", color: "bg-prism-community-cultural/10" },
  community_milestone: { emoji: "🎉", color: "bg-prism-accent-like/10" },
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
    <div className="min-h-screen bg-prism-bg-primary">
      <header className="border-b border-prism-border bg-prism-bg-secondary/95 backdrop-blur-md sticky top-0 z-30">
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
              className="text-xs text-prism-accent-active hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-prism-accent-active/30 border-t-prism-accent-active rounded-full animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-prism-border">
            {notifications.map((notif) => {
              const icon = NOTIF_ICONS[notif.type];
              return (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`w-full text-left px-4 py-4 flex items-start gap-3 transition-colors ${
                    notif.read ? "opacity-60" : "bg-prism-accent-active/[0.03]"
                  } hover:bg-prism-bg-elevated`}
                >
                  <div className={`w-10 h-10 rounded-full ${icon.color} flex items-center justify-center shrink-0 text-base`}>
                    {icon.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-prism-text-primary">{notif.title}</span>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-prism-accent-active shrink-0" />
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
