"use client";

import { useEffect, useState } from "react";
import { checkMilestone, markMilestoneShown, getStreak, type StreakMilestone } from "@/lib/streak";

const BADGE_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  "consistent-voice": { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "text-blue-400" },
  "founding-voice": { bg: "bg-prism-accent-primary/10", border: "border-prism-accent-primary/30", icon: "text-prism-accent-primary" },
  "century-voice": { bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "text-purple-400" },
};

export function StreakMilestoneModal() {
  const [milestone, setMilestone] = useState<StreakMilestone | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check on mount and when streak updates
    const streak = getStreak();
    const hit = checkMilestone(streak.count);
    if (hit) {
      setMilestone(hit);
      // Small delay for entrance animation
      setTimeout(() => setVisible(true), 300);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    if (milestone) {
      markMilestoneShown(milestone.days);
    }
    setTimeout(() => setMilestone(null), 300);
  }

  if (!milestone) return null;

  const style = BADGE_STYLES[milestone.badge] ?? BADGE_STYLES["consistent-voice"];

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className={`relative bg-prism-bg-surface border ${style.border} rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl transform transition-transform duration-300 ${visible ? "scale-100" : "scale-90"}`}>
        {/* Badge icon */}
        <div className={`w-16 h-16 ${style.bg} rounded-full flex items-center justify-center mx-auto mb-4 border ${style.border}`}>
          {milestone.badge === "century-voice" ? (
            <svg className={`w-8 h-8 ${style.icon}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          ) : (
            <svg className={`w-8 h-8 ${style.icon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <h2 className="text-lg font-display font-bold text-prism-text-primary text-center mb-1">
          {milestone.title}
        </h2>
        <p className="text-xs font-mono text-prism-accent-primary text-center mb-3">
          {milestone.days}-day streak
        </p>
        <p className="text-sm text-prism-text-secondary text-center leading-relaxed mb-6">
          {milestone.description}
        </p>

        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="w-full py-2.5 rounded-xl bg-prism-accent-primary text-white font-body font-medium text-sm"
        >
          Keep going
        </button>
      </div>
    </div>
  );
}
