"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "prism-early-access-dismissed";

export function EarlyAccessBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="w-full bg-prism-accent-active/10 border-b border-prism-accent-active/20 px-4 py-2 flex items-center justify-center gap-3 relative z-50">
      <span className="text-xs sm:text-sm text-prism-text-primary font-medium">
        <span className="font-display italic text-prism-accent-active">Early Access</span>
        {" — "}You&apos;re among the first to experience PRISM. Things may shift as we grow.
      </span>
      <button
        onClick={dismiss}
        className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors text-prism-text-dim hover:text-prism-text-primary"
        aria-label="Dismiss early access banner"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
