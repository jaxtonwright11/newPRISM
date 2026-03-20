"use client";

import { useState } from "react";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

interface ConnectionModalProps {
  communityName: string;
  communityType: CommunityType;
  communityRegion: string;
  perspectiveQuote?: string;
  onClose: () => void;
  onSend?: (message: string) => void;
}

export function ConnectionModal({
  communityName,
  communityType,
  communityRegion,
  perspectiveQuote,
  onClose,
  onSend,
}: ConnectionModalProps) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const color = COMMUNITY_COLORS[communityType];
  const maxChars = 300;

  const handleSend = () => {
    if (message.trim().length === 0) return;
    onSend?.(message);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative bg-prism-bg-secondary border border-prism-border rounded-2xl max-w-sm w-full p-6 text-center animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-full bg-prism-accent-verified/15 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-prism-accent-verified"
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
        className="relative bg-prism-bg-secondary border border-prism-border rounded-2xl max-w-sm w-full animate-fade-in"
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

          {/* Perspective reference */}
          {perspectiveQuote && (
            <div
              className="p-3 rounded-lg bg-prism-bg-elevated border border-prism-border mb-4"
              style={{ borderLeftWidth: "2px", borderLeftColor: color }}
            >
              <p className="text-xs text-prism-text-dim mb-1">
                Inspired by this perspective:
              </p>
              <p className="text-sm text-prism-text-secondary italic font-display leading-snug">
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
              placeholder="Share what brought you to this perspective and what you'd like to understand better..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-active resize-none transition-shadow"
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
              disabled={message.trim().length === 0}
              className="flex-1 py-2.5 rounded-lg bg-prism-accent-active text-white text-sm font-medium hover:bg-prism-accent-active/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
