"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StreakToastProps {
  streak: number;
  onDismiss: () => void;
}

function getMilestoneMessage(streak: number): string | null {
  if (streak === 1) return "First perspective shared! Your voice matters.";
  if (streak === 3) return "3-day streak! You're building a habit.";
  if (streak === 7) return "7-day streak! You're a regular voice now.";
  if (streak === 14) return "2-week streak! Your community counts on you.";
  if (streak === 30) return "30-day streak! You're a cornerstone.";
  if (streak >= 3 && streak % 10 === 0) return `${streak}-day streak! Incredible consistency.`;
  return null;
}

export function StreakToast({ streak, onDismiss }: StreakToastProps) {
  const [visible, setVisible] = useState(false);
  const message = getMilestoneMessage(streak);

  useEffect(() => {
    if (!message) {
      onDismiss();
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-primary)]/30 shadow-lg shadow-[var(--accent-primary)]/10 max-w-sm mx-auto"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/15 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 23c-3.5-1.5-7-5-7-10 0-3 1.5-5.5 3-7l1 3c1-2 3-4 3-7 3 3.5 7 7.5 7 14-2-1-3.5-2-4-3-.5 2-1.5 3.5-3 3.5V23z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-mono text-sm font-bold text-[var(--accent-primary)]">{streak}</span>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{message}</p>
          </div>
          <button
            onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
            className="text-[var(--text-dim)] hover:text-[var(--text-secondary)] shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
