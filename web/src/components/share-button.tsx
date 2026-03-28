"use client";

import { useState } from "react";

interface ShareButtonProps {
  perspectiveId: string;
  quote: string; // First ~80 chars used as share text
}

export function ShareButton({ perspectiveId, quote }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/perspective/${perspectiveId}`;
    const shareText = quote.length > 80 ? quote.slice(0, 77) + "..." : quote;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "PRISM Perspective",
          text: shareText,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Can't copy
    }
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleShare();
      }}
      className="flex items-center gap-1 text-prism-text-dim hover:text-prism-text-secondary transition-colors"
      title="Share"
      aria-label="Share perspective"
    >
      {/* Share/arrow-up-from-square icon */}
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
      </svg>
      <span className="text-[10px]">{copied ? "Copied!" : ""}</span>
    </button>
  );
}
