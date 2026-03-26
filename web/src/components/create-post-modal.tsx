"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { prismEvents } from "@/lib/posthog";
import { VerificationGate } from "@/components/verification-gate";
import type { PostType, RadiusMiles } from "@shared/types";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: (post: {
    id: string;
    content: string;
    post_type: PostType;
    radius_miles: RadiusMiles;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
  }) => void;
  topicId?: string | null;
}

const RADIUS_OPTIONS: RadiusMiles[] = [10, 20, 30, 40];

export function CreatePostModal({
  open,
  onOpenChange,
  onPostCreated,
  topicId,
}: CreatePostModalProps) {
  const { session } = useAuth();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>("permanent");
  const [radiusMiles, setRadiusMiles] = useState<RadiusMiles>(40);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationLevel, setVerificationLevel] = useState<number>(1);
  const [showVerifyGate, setShowVerifyGate] = useState(false);

  // Fetch user's verification level when modal opens
  useEffect(() => {
    if (!open || !session?.access_token) return;
    fetch("/api/user/profile", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.verification_level) {
          setVerificationLevel(res.data.verification_level);
        }
      })
      .catch(() => {});
  }, [open, session?.access_token]);

  const charCount = content.length;
  const maxChars = 1000;

  const handleSubmit = async () => {
    if (!content.trim() || !session?.access_token) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          post_type: postType,
          radius_miles: radiusMiles,
          topic_id: topicId ?? null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }

      const { data } = await res.json();
      prismEvents.postCreated(postType, radiusMiles, false);
      onPostCreated?.(data);
      setContent("");
      setPostType("permanent");
      setRadiusMiles(40);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // Gate: require Level 2+ to create posts
  if (session && verificationLevel < 2) {
    return (
      <>
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
          <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] p-4">
            <div className="bg-prism-bg-surface border border-prism-border rounded-2xl shadow-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-prism-accent-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-prism-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-prism-text-primary mb-2">
                Verification Required
              </h3>
              <p className="text-xs text-prism-text-secondary leading-relaxed mb-5">
                To create posts and appear on the map, you need to verify your community affiliation (Level 2).
              </p>
              <button
                onClick={() => setShowVerifyGate(true)}
                className="w-full py-2.5 rounded-xl bg-prism-accent-primary text-white text-sm font-semibold hover:bg-prism-accent-primary/90 transition-colors"
              >
                Verify Now
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="w-full mt-2 text-center text-xs text-prism-text-dim hover:text-prism-text-secondary transition-colors py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        <VerificationGate
          open={showVerifyGate}
          onClose={() => setShowVerifyGate(false)}
          requiredLevel={2}
          onVerified={(level) => setVerificationLevel(level)}
        />
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-4">
        <div className="bg-prism-bg-surface border border-prism-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-prism-border">
            <h2 className="text-sm font-semibold text-prism-text-primary">
              Create Post
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-lg text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Text area */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
                placeholder="Share your perspective..."
                rows={4}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-primary resize-none leading-relaxed"
              />
              <div className="flex justify-end mt-1">
                <span
                  className={`text-[10px] font-mono ${
                    charCount > maxChars * 0.9
                      ? "text-prism-accent-live"
                      : "text-prism-text-dim"
                  }`}
                >
                  {charCount}/{maxChars}
                </span>
              </div>
            </div>

            {/* Post type toggle */}
            <div>
              <label className="text-[11px] font-medium text-prism-text-dim uppercase tracking-wider mb-2 block">
                Post Type
              </label>
              <div className="flex gap-1 bg-prism-bg-elevated rounded-full p-1">
                <button
                  onClick={() => setPostType("permanent")}
                  className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                    postType === "permanent"
                      ? "bg-prism-accent-primary text-white shadow-sm"
                      : "text-prism-text-secondary hover:text-prism-text-primary"
                  }`}
                >
                  Permanent
                </button>
                <button
                  onClick={() => setPostType("story")}
                  className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1.5 ${
                    postType === "story"
                      ? "bg-gradient-to-r from-prism-accent-primary to-amber-500 text-white shadow-sm"
                      : "text-prism-text-secondary hover:text-prism-text-primary"
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Story (24h)
                </button>
              </div>
            </div>

            {/* Radius selector */}
            <div>
              <label className="text-[11px] font-medium text-prism-text-dim uppercase tracking-wider mb-2 block">
                Visibility Radius
              </label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadiusMiles(r)}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-150 border ${
                      radiusMiles === r
                        ? "bg-prism-accent-primary/10 border-prism-accent-primary text-prism-accent-primary"
                        : "bg-prism-bg-elevated border-prism-border text-prism-text-secondary hover:border-prism-text-dim"
                    }`}
                  >
                    {r} mi
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs text-prism-accent-live bg-prism-accent-live/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Not logged in warning */}
            {!session && (
              <div className="text-xs text-prism-text-dim bg-prism-bg-elevated px-3 py-2 rounded-lg text-center">
                Sign in to create posts
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-prism-border">
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || !session || submitting}
              className="w-full py-2.5 rounded-xl bg-prism-accent-primary text-white text-sm font-semibold hover:bg-prism-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting...
                </span>
              ) : (
                `Post ${postType === "story" ? "Story" : ""}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
