"use client";

import Link from "next/link";
import { useState } from "react";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

interface MockConnection {
  id: string;
  person: {
    initials: string;
    community: string;
    communityType: CommunityType;
    region: string;
  };
  topic: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
}

const MOCK_CONNECTIONS: MockConnection[] = [
  {
    id: "conn-1",
    person: {
      initials: "M.R.",
      community: "Mexican-American Diaspora",
      communityType: "diaspora",
      region: "El Paso, TX",
    },
    topic: "US-Mexico Border Policy Changes",
    lastMessage:
      "Thanks for reaching out — your perspective on this is really helpful to understand.",
    lastMessageTime: "2h ago",
    unread: true,
  },
  {
    id: "conn-2",
    person: {
      initials: "T.W.",
      community: "Detroit Auto Workers",
      communityType: "civic",
      region: "Detroit, MI",
    },
    topic: "Electric Vehicle Transition",
    lastMessage: "The retraining programs sound great on paper but...",
    lastMessageTime: "1d ago",
    unread: false,
  },
];

function MessageThread({ connection }: { connection: MockConnection }) {
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "them",
      content: `Hi — thanks for connecting about "${connection.topic}". I read your intro and wanted to respond.`,
      time: "3d ago",
    },
    {
      id: "m2",
      sender: "me",
      content:
        "Thanks for accepting! I'm really curious about your day-to-day experience with this issue.",
      time: "2d ago",
    },
    {
      id: "m3",
      sender: "them",
      content: connection.lastMessage,
      time: connection.lastMessageTime,
    },
  ]);
  const [draft, setDraft] = useState("");

  const color =
    COMMUNITY_COLORS[connection.person.communityType as CommunityType];

  const send = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, sender: "me", content: draft.trim(), time: "now" },
    ]);
    setDraft("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="px-4 py-3 border-b border-prism-border flex items-center gap-3 bg-prism-bg-secondary">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: color + "20", color }}
        >
          {connection.person.initials}
        </div>
        <div>
          <p className="text-sm font-medium text-prism-text-primary">
            {connection.person.community}
          </p>
          <p className="text-[10px] text-prism-text-dim">
            Connected about: {connection.topic}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center">
          <span className="text-[10px] text-prism-text-dim px-3 py-1 rounded-full bg-prism-bg-elevated">
            Connected via {connection.topic}
          </span>
        </div>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.sender === "me"
                  ? "bg-prism-accent-active text-white rounded-br-sm"
                  : "bg-prism-bg-elevated text-prism-text-primary border border-prism-border rounded-bl-sm"
              }`}
            >
              {msg.content}
              <p
                className={`text-[10px] mt-1 ${
                  msg.sender === "me"
                    ? "text-white/60"
                    : "text-prism-text-dim"
                }`}
              >
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="p-3 border-t border-prism-border bg-prism-bg-secondary">
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
            className="flex-1 px-3 py-2 rounded-xl bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-active resize-none"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="p-2.5 rounded-xl bg-prism-accent-active text-white disabled:opacity-40 transition-opacity shrink-0"
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

export default function MessagesPage() {
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(
    null
  );
  const activeConnection = MOCK_CONNECTIONS.find(
    (c) => c.id === activeConnectionId
  );

  return (
    <div className="min-h-screen bg-prism-bg-primary flex flex-col">
      {/* Header */}
      <header className="bg-prism-bg-secondary border-b border-prism-border sticky top-0 z-10">
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
          <h1 className="font-display text-base font-bold text-prism-text-primary">
            Messages
          </h1>
          <span className="text-xs text-prism-text-dim ml-auto">
            {MOCK_CONNECTIONS.filter((c) => c.unread).length} unread
          </span>
        </div>
      </header>

      <div className="flex-1 flex max-w-4xl mx-auto w-full">
        {/* Connection list */}
        <div
          className={`${
            activeConnection ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 border-r border-prism-border bg-prism-bg-secondary shrink-0`}
        >
          <div className="p-4">
            <p className="text-xs text-prism-text-dim mb-4">
              Topic-anchored connections only. Conversations begin with shared context.
            </p>
            <div className="space-y-1">
              {MOCK_CONNECTIONS.map((conn) => {
                const color = COMMUNITY_COLORS[conn.person.communityType];
                return (
                  <button
                    key={conn.id}
                    onClick={() => setActiveConnectionId(conn.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      activeConnectionId === conn.id
                        ? "bg-prism-accent-active/10 border border-prism-accent-active/30"
                        : "hover:bg-prism-bg-elevated border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: color + "20", color }}
                      >
                        {conn.person.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-prism-text-primary truncate">
                            {conn.person.community}
                          </p>
                          {conn.unread && (
                            <span className="w-2 h-2 rounded-full bg-prism-accent-active shrink-0 ml-2" />
                          )}
                        </div>
                        <p className="text-[10px] text-prism-text-dim truncate mb-1">
                          {conn.topic}
                        </p>
                        <p className="text-xs text-prism-text-secondary truncate">
                          {conn.lastMessage}
                        </p>
                        <p className="text-[10px] text-prism-text-dim mt-1">{conn.lastMessageTime}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {MOCK_CONNECTIONS.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-prism-bg-elevated flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="text-sm text-prism-text-dim mb-1">No messages yet</p>
              <p className="text-xs text-prism-text-dim/70">
                Connect with someone from a community you read about to start a conversation.
              </p>
            </div>
          )}
        </div>

        {/* Message thread */}
        {activeConnection ? (
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
            <MessageThread connection={activeConnection} />
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
