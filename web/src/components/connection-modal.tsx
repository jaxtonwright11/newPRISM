"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { COMMUNITY_COLORS } from "@/lib/constants";
import { prismEvents } from "@/lib/posthog";
import type { CommunityType } from "@shared/types";

interface ConnectionModalProps {
  communityName: string;
  communityType: CommunityType;
  communityRegion: string;
  perspectiveQuote?: string;
  recipientId?: string;
  topicId?: string;
  topicTitle?: string;
  perspectiveId?: string;
  onClose: () => void;
  onSend?: (message: string) => void;
}

export function ConnectionModal({
  communityName,
  communityType,
  communityRegion,
  perspectiveQuote,
  recipientId,
  topicId,
  topicTitle,
  perspectiveId,
  onClose,
  onSend,
}: ConnectionModalProps) {
  const { session } = useAuth();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const color = COMMUNITY_COLORS[communityType];
  const maxChars = 500;

  const handleSend = async () => {
    if (message.trim().length === 0) return;

    // If we have a recipientId and auth, use the real API
    if (recipientId && session?.access_token) {
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/connections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recipient_id: recipientId,
            topic_id: topicId ?? null,
            perspective_id: perspectiveId ?? null,
            intro_message: message.trim(),
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed (${res.status})`);
        }

        setSent(true);
        prismEvents.connectionRequestSent(communityName, communityRegion);
        onSend?.(message);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    } else {
      // Fallback for non-API usage
      onSend?.(message);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative bg-prism-bg-surface border border-prism-border rounded-2xl max-w-sm w-full p-6 text-center animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-full bg-prism-accent-live/15 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-prism-accent-live"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-prism-text-primary mb-1">
            Connection request sent
          </h3>
          <p className="text-sm text-prism-text-secondary mb-5">
            A member of {communityName} will see your message. Connections are
            built on mutual interest in understanding.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-prism-bg-elevated text-sm text-prism-text-primary hover:bg-prism-bg-elevated/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-prism-bg-surface border border-prism-border rounded-2xl max-w-sm w-full animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: color + "20",
                color: color,
              }}
            >
              {communityName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <h3 className="text-base font-semibold text-prism-text-primary">
                Connect with {communityName}
              </h3>
              <span className="text-xs text-prism-text-dim">
                {communityRegion}
              </span>
            </div>
          </div>

          {/* Topic anchor */}
          {topicTitle && (
            <div className="bg-prism-bg-elevated rounded-lg p-3 border border-prism-border mb-4">
              <p className="text-[10px] font-semibold text-prism-text-dim uppercase tracking-wider mb-1">
                Connected by topic
              </p>
              <p className="text-sm font-medium text-prism-text-primary">
                {topicTitle}
              </p>
            </div>
          )}

          {/* Perspective reference */}
          {perspectiveQuote && (
            <div
              className="p-3 rounded-lg bg-prism-bg-elevated border border-prism-border mb-4"
              style={{ borderLeftWidth: "2px", borderLeftColor: color }}
            >
              <p className="text-xs text-prism-text-dim mb-1">
                Inspired by this perspective:
              </p>
              <p className="text-sm text-prism-text-secondary font-body leading-snug">
                &ldquo;
                {perspectiveQuote.length > 120
                  ? perspectiveQuote.slice(0, 120) + "..."
                  : perspectiveQuote}
                &rdquo;
              </p>
            </div>
          )}

          {/* Message input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-prism-text-secondary mb-1.5">
              Introduce yourself
            </label>
            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value.slice(0, maxChars))
              }
              placeholder={`Share what brought you to this perspective${topicTitle ? ` on "${topicTitle}"` : ""} and what you'd like to understand better...`}
              rows={4}
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-primary resize-none transition-shadow"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-prism-text-dim">
                Be thoughtful — first impressions matter
              </span>
              <span
                className={`text-[10px] font-mono ${
                  message.length > maxChars * 0.9
                    ? "text-prism-accent-live"
                    : "text-prism-text-dim"
                }`}
              >
                {message.length}/{maxChars}
              </span>
            </div>
          </div>

          {error && (
            <div className="text-xs text-prism-accent-live bg-prism-accent-live/10 px-3 py-2 rounded-lg mb-3">
              {error}
            </div>
          )}

          {!session && (
            <div className="text-xs text-prism-text-dim bg-prism-bg-elevated px-3 py-2 rounded-lg text-center mb-3">
              Sign in to send connection requests
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-prism-bg-elevated text-sm text-prism-text-secondary hover:text-prism-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={message.trim().length === 0 || submitting}
              className="flex-1 py-2.5 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send request"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
