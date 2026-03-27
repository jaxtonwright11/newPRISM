import type { CommunityType, ReactionType } from "@shared/types";

export const COMMUNITY_COLORS: Record<CommunityType, string> = {
  civic: "#3B82F6",
  diaspora: "#A855F7",
  rural: "#F59E0B",
  policy: "#22C55E",
  academic: "#06B6D4",
  cultural: "#F97316",
};

export const REACTION_LABELS: Record<
  ReactionType,
  { emoji: string; label: string }
> = {
  this_resonates: { emoji: "✦", label: "This resonates" },
  seeing_differently: { emoji: "◇", label: "Seeing this differently" },
  want_to_understand: { emoji: "→", label: "I want to understand more" },
};
