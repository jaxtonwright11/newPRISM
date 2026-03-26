"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { COMMUNITY_COLORS } from "@/lib/constants";
import { EMPTY_STATES } from "@/components/empty-state";
import type { CommunityType } from "@shared/types";

interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  intro_message: string;
  created_at: string;
  topic: { id: string; title: string } | null;
  requester: { id: string; username: string; display_name: string | null; home_community: { name: string; community_type: CommunityType; region: string } | null } | null;
  recipient: { id: string; username: string; display_name: string | null; home_community: { name: string; community_type: CommunityType; region: string } | null } | null;
}

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { id: string; username: string; display_name: string | null };
}

function MessageThread({
  connection,
  currentUserId,
}: {
  connection: Connection;
  currentUserId: string;
}) {
  const { session, supabase } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherPerson = connection.requester_id === currentUserId
    ? connection.recipient
    : connection.requester;

  const communityType = otherPerson?.home_community?.community_type ?? "civic";
  const color = COMMUNITY_COLORS[communityType];

  // Fetch messages
  useEffect(() => {
    async function fetchMessages() {
      if (!session?.access_token) return;
      try {
        const res = await fetch(
          `/api/messages?connection_id=${connection.id}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [connection.id, session?.access_token]);

  // Subscribe to Realtime for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${connection.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `connection_id=eq.${connection.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Deduplicate
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connection.id, supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    if (!draft.trim() || !session?.access_token) return;
    const content = draft.trim();
    setDraft("");

    // Optimistic add
    const optimisticId = `opt-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        connection_id: connection.id,
        sender_id: currentUserId,
        content,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ connection_id: connection.id, content }),
      });
      if (res.ok) {
        const { message } = await res.json();
        // Replace optimistic with real
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? message : m))
        );
      }
    } catch {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    }
  }, [draft, session?.access_token, connection.id, currentUserId]);

  const initials = otherPerson
    ? (otherPerson.display_name ?? otherPerson.username)
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="px-4 py-3 border-b border-prism-border flex items-center gap-3 bg-prism-bg-surface">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: color + "20", color }}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-prism-text-primary">
            {otherPerson?.home_community?.name ?? otherPerson?.username ?? "Unknown"}
          </p>
          {connection.topic && (
            <p className="text-[10px] text-prism-text-dim">
              Connected about: {connection.topic.title}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {connection.topic && (
          <div className="text-center">
            <span className="text-[10px] text-prism-text-dim px-3 py-1 rounded-full bg-prism-bg-elevated">
              Connected via {connection.topic.title}
            </span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 py-4 px-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className={`h-8 rounded-2xl bg-prism-bg-elevated animate-shimmer ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
              </div>
            ))}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-prism-accent-primary text-white rounded-br-sm"
                      : "bg-prism-bg-elevated text-prism-text-primary border border-prism-border rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe ? "text-white/60" : "text-prism-text-dim"
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <div className="p-3 border-t border-prism-border bg-prism-bg-surface">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
            placeholder="Write a message..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="flex-1 px-3 py-2 rounded-xl bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-primary resize-none"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="p-2.5 rounded-xl bg-prism-accent-primary text-white disabled:opacity-40 transition-opacity shrink-0"
            aria-label="Send"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export default function MessagesPage() {
  const { session, user, supabase } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch accepted connections
  useEffect(() => {
    async function fetchConnections() {
      if (!session?.access_token || !user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("community_connections")
          .select(`
            id, requester_id, recipient_id, status, intro_message, created_at,
            topic:topics(id, title),
            requester:users!requester_id(id, username, display_name, home_community:communities(name, community_type, region)),
            recipient:users!recipient_id(id, username, display_name, home_community:communities(name, community_type, region))
          `)
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setConnections(data as unknown as Connection[]);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchConnections();
  }, [session?.access_token, user, supabase]);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  return (
    <div className="min-h-screen bg-prism-bg-base flex flex-col">
      {/* Header */}
      <header className="bg-prism-bg-surface border-b border-prism-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-prism-text-dim hover:text-prism-text-primary transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="font-body text-base font-bold text-prism-text-primary">
            Messages
          </h1>
          <span className="text-xs text-prism-text-dim ml-auto">
            {connections.length} conversation{connections.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="flex-1 flex max-w-4xl mx-auto w-full">
        {/* Connection list */}
        <div
          className={`${
            activeConnection ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 border-r border-prism-border bg-prism-bg-surface shrink-0`}
        >
          <div className="p-4">
            <p className="text-xs text-prism-text-dim mb-4">
              Topic-anchored connections only. Conversations begin with shared context.
            </p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-prism-bg-elevated animate-shimmer shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-prism-bg-elevated rounded-full w-2/3 animate-shimmer" />
                      <div className="h-2.5 bg-prism-bg-elevated rounded-full w-1/3 animate-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : connections.length > 0 ? (
              <div className="space-y-1">
                {connections.map((conn) => {
                  const other = conn.requester_id === user?.id
                    ? conn.recipient
                    : conn.requester;
                  const communityType = other?.home_community?.community_type ?? "civic";
                  const color = COMMUNITY_COLORS[communityType];
                  const initials = other
                    ? (other.display_name ?? other.username)
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "?";

                  return (
                    <button
                      key={conn.id}
                      onClick={() => setActiveConnectionId(conn.id)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        activeConnectionId === conn.id
                          ? "bg-prism-accent-primary/10 border border-prism-accent-primary/30"
                          : "hover:bg-prism-bg-elevated border border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                          style={{ backgroundColor: color + "20", color }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-prism-text-primary truncate">
                            {other?.home_community?.name ?? other?.username ?? "Unknown"}
                          </p>
                          {conn.topic && (
                            <p className="text-[10px] text-prism-text-dim truncate mb-1">
                              {conn.topic.title}
                            </p>
                          )}
                          <p className="text-xs text-prism-text-secondary truncate">
                            {conn.intro_message}
                          </p>
                          <p className="text-[10px] text-prism-text-dim mt-1">
                            {formatTime(conn.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-sm font-medium text-prism-text-primary mb-1">{EMPTY_STATES.messages.heading}</p>
                <p className="text-xs text-prism-text-secondary max-w-xs">
                  {EMPTY_STATES.messages.body}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Message thread */}
        {activeConnection && user ? (
          <div className="flex-1 flex flex-col h-[calc(100vh-57px)]">
            <button
              onClick={() => setActiveConnectionId(null)}
              className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-prism-border text-sm text-prism-text-dim hover:text-prism-text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              All messages
            </button>
            <MessageThread
              connection={activeConnection}
              currentUserId={user.id}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-prism-bg-elevated flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="text-sm text-prism-text-dim">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
