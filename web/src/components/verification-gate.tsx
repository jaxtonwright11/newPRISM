"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

interface Community {
  id: string;
  name: string;
  region: string;
  community_type: CommunityType;
  color_hex: string;
}

interface VerificationGateProps {
  open: boolean;
  onClose: () => void;
  requiredLevel: 2 | 3;
  onVerified?: (newLevel: number) => void;
}

export function VerificationGate({
  open,
  onClose,
  requiredLevel,
  onVerified,
}: VerificationGateProps) {
  const { session } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");
  const [locationContext, setLocationContext] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/communities")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setCommunities(res.data);
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const handleLevel2 = async () => {
    if (!selectedCommunity || !locationContext.trim() || !session?.access_token) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/user/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "upgrade_to_level_2",
          community_id: selectedCommunity,
          location_context: locationContext.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");

      setSuccess(data.message);
      onVerified?.(2);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLevel3 = async () => {
    if (!selectedCommunity || applicationMessage.length < 20 || !session?.access_token)
      return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/user/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "apply_for_level_3",
          community_id: selectedCommunity,
          application_message: applicationMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Application failed");

      setSuccess(data.message);
      setTimeout(onClose, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-4">
        <div className="bg-prism-bg-secondary border border-prism-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-prism-border">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-prism-text-primary">
                {requiredLevel === 2
                  ? "Verify Your Location"
                  : "Apply as Contributor"}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-prism-text-dim hover:text-prism-text-primary hover:bg-prism-bg-elevated transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-prism-text-dim mt-1">
              {requiredLevel === 2
                ? "To create posts and appear on the map, verify your community affiliation."
                : "Apply to submit official community perspective cards."}
            </p>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {success ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-prism-accent-verified/10 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-prism-accent-verified"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-prism-text-primary font-medium">
                  {success}
                </p>
              </div>
            ) : (
              <>
                {/* Community selector */}
                <div>
                  <label className="text-[11px] font-medium text-prism-text-dim uppercase tracking-wider mb-2 block">
                    Your Community
                  </label>
                  <select
                    value={selectedCommunity}
                    onChange={(e) => setSelectedCommunity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary focus:outline-none focus:ring-1 focus:ring-prism-accent-active appearance-none"
                  >
                    <option value="">Select a community...</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.region}
                      </option>
                    ))}
                  </select>
                  {selectedCommunity && (
                    <div className="flex items-center gap-2 mt-2">
                      {(() => {
                        const comm = communities.find(
                          (c) => c.id === selectedCommunity
                        );
                        if (!comm) return null;
                        const color =
                          COMMUNITY_COLORS[comm.community_type];
                        return (
                          <>
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-prism-text-secondary">
                              {comm.community_type} community
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {requiredLevel === 2 ? (
                  <div>
                    <label className="text-[11px] font-medium text-prism-text-dim uppercase tracking-wider mb-2 block">
                      How are you connected to this community?
                    </label>
                    <textarea
                      value={locationContext}
                      onChange={(e) =>
                        setLocationContext(e.target.value.slice(0, 500))
                      }
                      placeholder="I live in this neighborhood / I'm part of this organization / I grew up here..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-active resize-none leading-relaxed"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-medium text-prism-text-dim uppercase tracking-wider mb-2 block">
                      Why should you represent this community?
                    </label>
                    <textarea
                      value={applicationMessage}
                      onChange={(e) =>
                        setApplicationMessage(e.target.value.slice(0, 2000))
                      }
                      placeholder="Tell us about your role in this community, your perspective, and why you want to contribute official perspective cards..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-active resize-none leading-relaxed"
                    />
                    <div className="flex justify-end mt-1">
                      <span
                        className={`text-[10px] font-mono ${
                          applicationMessage.length < 20
                            ? "text-prism-accent-live"
                            : "text-prism-text-dim"
                        }`}
                      >
                        {applicationMessage.length}/2000 (min 20)
                      </span>
                    </div>
                  </div>
                )}

                {/* Verification levels explainer */}
                <div className="bg-prism-bg-elevated rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-semibold text-prism-text-dim uppercase tracking-wider">
                    Verification Levels
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-prism-text-secondary" />
                      <span className="text-[11px] text-prism-text-secondary">
                        Level 1 — Read and react to perspectives
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-prism-accent-active" />
                      <span
                        className={`text-[11px] ${
                          requiredLevel === 2
                            ? "text-prism-accent-active font-medium"
                            : "text-prism-text-secondary"
                        }`}
                      >
                        Level 2 — Post, appear on map, connect
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-prism-accent-verified" />
                      <span
                        className={`text-[11px] ${
                          requiredLevel === 3
                            ? "text-prism-accent-verified font-medium"
                            : "text-prism-text-secondary"
                        }`}
                      >
                        Level 3 — Submit official perspective cards
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-prism-accent-live bg-prism-accent-live/10 px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="px-5 py-4 border-t border-prism-border">
              <button
                onClick={requiredLevel === 2 ? handleLevel2 : handleLevel3}
                disabled={
                  submitting ||
                  !selectedCommunity ||
                  (requiredLevel === 2
                    ? !locationContext.trim()
                    : applicationMessage.length < 20)
                }
                className="w-full py-2.5 rounded-xl bg-prism-accent-active text-white text-sm font-semibold hover:bg-prism-accent-active/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {requiredLevel === 2
                      ? "Verifying..."
                      : "Submitting..."}
                  </span>
                ) : requiredLevel === 2 ? (
                  "Verify My Location"
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
