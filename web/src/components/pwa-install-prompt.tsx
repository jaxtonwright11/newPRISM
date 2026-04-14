"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("prism-pwa-dismissed")) return;

    // Don't show on auth, onboarding, or landing pages
    const path = window.location.pathname;
    const suppressedPaths = ["/login", "/signup", "/onboarding"];
    if (suppressedPaths.some((p) => path.startsWith(p))) return;

    // Track page views — only show after user has visited 2+ pages
    const views = parseInt(sessionStorage.getItem("prism-page-views") ?? "0", 10) + 1;
    sessionStorage.setItem("prism-page-views", String(views));
    if (views < 2) return;

    // Delay showing by 60 seconds after qualifying
    const timer = setTimeout(() => {
      // Android/Chrome: capture beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", handler);

      // iOS Safari: detect and show manual instructions
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
        || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);
      if (isIOS && !isStandalone) {
        setShowIOSPrompt(true);
      }

      // Fire beforeinstallprompt if it already happened before timer
      if ((window as unknown as Record<string, unknown>).__pwaPromptEvent) {
        setDeferredPrompt((window as unknown as Record<string, unknown>).__pwaPromptEvent as BeforeInstallPromptEvent);
      }
    }, 60000);

    // Still capture the event early so we don't miss it
    const earlyHandler = (e: Event) => {
      e.preventDefault();
      (window as unknown as Record<string, unknown>).__pwaPromptEvent = e;
    };
    window.addEventListener("beforeinstallprompt", earlyHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", earlyHandler);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem("prism-pwa-dismissed", "1");
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIOSPrompt(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  };

  if (dismissed || (!deferredPrompt && !showIOSPrompt)) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 z-50 bg-prism-bg-elevated border border-prism-border rounded-xl p-4 shadow-2xl shadow-black/50 animate-fade-in">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-prism-text-dim hover:text-prism-text-primary transition-colors"
        aria-label="Dismiss install prompt"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-prism-accent-primary/20 flex items-center justify-center shrink-0">
          <span className="text-prism-accent-primary font-display font-bold text-sm">P</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-prism-text-primary mb-1">Install PRISM</p>
          {deferredPrompt ? (
            <>
              <p className="text-xs text-prism-text-secondary mb-3">
                Add PRISM to your home screen for the full experience.
              </p>
              <button
                onClick={install}
                className="w-full py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-primary/90 transition-colors"
              >
                Install App
              </button>
            </>
          ) : (
            <p className="text-xs text-prism-text-secondary">
              Tap <span className="inline-flex items-center mx-0.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg></span> then &quot;Add to Home Screen&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
