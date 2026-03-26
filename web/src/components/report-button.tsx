"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface ReportButtonProps {
  contentType: "perspective" | "post" | "community";
  contentId: string;
}

const reasons = [
  { value: "harassment", label: "Harassment" },
  { value: "misinformation", label: "Misinformation" },
  { value: "spam", label: "Spam" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "other", label: "Other" },
];

export function ReportButton({ contentType, contentId }: ReportButtonProps) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!session) return null;

  async function handleSubmit() {
    if (!reason || !session?.access_token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-prism-text-dim hover:text-prism-text-secondary transition-colors"
        aria-label="Report content"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
          />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => {
            if (!submitting) {
              setOpen(false);
            }
          }}
        >
          <div
            className="bg-prism-bg-surface rounded-t-2xl p-5 w-full max-w-lg border-t border-prism-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-prism-text-primary font-semibold text-lg mb-4">
              Report content
            </h2>

            {submitted ? (
              <div className="space-y-4">
                <p className="text-prism-text-secondary">
                  Thanks for reporting. We&apos;ll review this.
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    setSubmitted(false);
                    setReason("");
                    setDetails("");
                  }}
                  className="w-full py-2.5 rounded-lg bg-prism-accent-primary text-white font-medium"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {reasons.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        reason === r.value
                          ? "bg-prism-accent-primary/15 border-prism-accent-primary/30 text-prism-text-primary"
                          : "border-prism-border text-prism-text-secondary hover:border-prism-border-hover"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Additional details (optional)"
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-prism-border bg-prism-bg-surface px-4 py-3 text-prism-text-primary placeholder:text-prism-text-dim resize-none focus:outline-none focus:border-prism-accent-primary/50"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setReason("");
                      setDetails("");
                    }}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg text-prism-text-secondary font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason || submitting}
                    className="flex-1 py-2.5 rounded-lg bg-prism-accent-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
