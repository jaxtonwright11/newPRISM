const STREAK_KEY = "prism_streak";
const MILESTONE_KEY = "prism_milestones_shown";

interface StreakData {
  count: number;
  lastPostDate: string; // YYYY-MM-DD
}

export interface StreakMilestone {
  days: number;
  badge: string;
  title: string;
  description: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 7, badge: "consistent-voice", title: "Consistent Voice", description: "7 days of sharing your perspective. Your community is heard." },
  { days: 30, badge: "founding-voice", title: "Founding Voice", description: "30 days strong. You're a cornerstone of PRISM." },
  { days: 100, badge: "century-voice", title: "Century Voice", description: "100 days. Your perspective has shaped countless conversations." },
];

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function getStreak(): StreakData {
  if (typeof window === "undefined") return { count: 0, lastPostDate: "" };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, lastPostDate: "" };
    const data: StreakData = JSON.parse(raw);

    // If last post was before yesterday, streak is broken (reset silently)
    if (data.lastPostDate !== today() && data.lastPostDate !== yesterday()) {
      return { count: 0, lastPostDate: "" };
    }
    return data;
  } catch {
    return { count: 0, lastPostDate: "" };
  }
}

export function recordPost(): StreakData {
  const current = getStreak();
  const todayStr = today();

  if (current.lastPostDate === todayStr) {
    // Already posted today — no change
    return current;
  }

  const newCount = current.lastPostDate === yesterday()
    ? current.count + 1 // Consecutive day
    : 1; // New streak or first post

  const updated: StreakData = { count: newCount, lastPostDate: todayStr };
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}

export function getStreakMessage(count: number): string | null {
  if (count >= 30) return `${count}-day streak — you're a cornerstone of your community.`;
  if (count >= 7) return `${count}-day streak — you're a regular voice here.`;
  if (count >= 3) return `${count}-day streak — keep it going.`;
  return null;
}

/**
 * Check if a milestone was just hit and hasn't been shown yet.
 * Returns the milestone to show, or null.
 */
export function checkMilestone(count: number): StreakMilestone | null {
  if (typeof window === "undefined") return null;

  const shown = getShownMilestones();

  for (const milestone of STREAK_MILESTONES) {
    if (count >= milestone.days && !shown.has(milestone.days)) {
      return milestone;
    }
  }
  return null;
}

export function markMilestoneShown(days: number): void {
  if (typeof window === "undefined") return;
  const shown = getShownMilestones();
  shown.add(days);
  localStorage.setItem(MILESTONE_KEY, JSON.stringify(Array.from(shown)));
}

function getShownMilestones(): Set<number> {
  try {
    const raw = localStorage.getItem(MILESTONE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

/**
 * Get all earned badges for profile display.
 */
export function getEarnedBadges(count: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter((m) => count >= m.days);
}
