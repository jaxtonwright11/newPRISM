"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { isPushSupported, isPushSubscribed, subscribeToPush } from "@/lib/push";

export function PushPrompt() {
  const { session } = useAuth();
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;

    const checkPush = async () => {
      const supported = await isPushSupported();
      if (!supported) return;

      const subscribed = await isPushSubscribed();
      if (subscribed) return;

      // Don't show if user already dismissed
      const dismissed = localStorage.getItem("prism-push-dismissed");
      if (dismissed) return;

      // Show after a 3-second delay so it doesn't interrupt
      setTimeout(() => setShow(true), 3000);
    };

    checkPush();
  }, [session?.access_token]);

  const handleEnable = async () => {
    if (!session?.access_token) return;
    setSubscribing(true);
    await subscribeToPush(session.access_token);
    setSubscribing(false);
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("prism-push-dismissed", "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-elevated)] rounded-xl p-4 shadow-2xl shadow-black/40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-sm text-[var(--text-primary)]">
                  Stay in the loop
                </p>
                <p className="font-body text-xs text-[var(--text-secondary)] mt-0.5">
                  Get notified when communities share new perspectives on topics you care about.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={subscribing}
                className="flex-1 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-body font-medium hover:shadow-lg transition-all disabled:opacity-50 min-h-[36px]"
              >
                {subscribing ? "Enabling..." : "Enable notifications"}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-lg text-xs font-body text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors min-h-[36px]"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
