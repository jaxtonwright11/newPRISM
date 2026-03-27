"use client";

import { useState, useEffect, useCallback } from "react";

interface ShareModalProps {
  title: string;
  quote?: string;
  communityName?: string;
  onClose: () => void;
}

export function ShareModal({
  title,
  quote,
  communityName,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  const shareText = quote
    ? `"${quote}" — ${communityName ?? "PRISM Community"} on ${title}`
    : `${title} — via PRISM`;

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "https://prismreason.com";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const shareOptions = [
    {
      label: "Copy link",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.636 9.13"
          />
        </svg>
      ),
      action: handleCopyLink,
      state: copied ? "Copied!" : undefined,
    },
    {
      label: "X / Twitter",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-prism-bg-surface border border-prism-border rounded-t-2xl md:rounded-2xl w-full max-w-sm animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Handle bar (mobile) */}
          <div className="w-8 h-1 rounded-full bg-prism-border mx-auto mb-4 md:hidden" />

          <h3 id="share-modal-title" className="text-base font-semibold text-prism-text-primary mb-4">
            Share
          </h3>

          {/* Preview */}
          {quote && (
            <div className="p-3 rounded-lg bg-prism-bg-elevated border border-prism-border mb-4">
              <p className="text-xs text-prism-text-secondary font-body leading-snug mb-1">
                &ldquo;
                {quote.length > 80 ? quote.slice(0, 80) + "..." : quote}
                &rdquo;
              </p>
              {communityName && (
                <p className="text-[10px] text-prism-text-dim">
                  — {communityName}
                </p>
              )}
            </div>
          )}

          {/* Share options */}
          <div className="space-y-1.5">
            {shareOptions.map((option) => (
              <button
                key={option.label}
                onClick={option.action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-prism-text-primary hover:bg-prism-bg-elevated transition-colors"
              >
                <span className="text-prism-text-dim">{option.icon}</span>
                <span className="text-sm font-medium flex-1 text-left">
                  {option.state ?? option.label}
                </span>
                {option.state && (
                  <svg
                    className="w-4 h-4 text-prism-accent-live"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 rounded-lg text-sm text-prism-text-dim hover:text-prism-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
