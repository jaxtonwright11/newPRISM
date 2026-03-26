const STREAK_KEY = "prism_streak";

interface StreakData {
  count: number;
  lastPostDate: string; // YYYY-MM-DD
}

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
