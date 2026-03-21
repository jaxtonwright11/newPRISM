// PRISM Design Spec — exact values, never deviate
export const colors = {
  bg: {
    primary: "#0A0A0F",
    secondary: "#12121A",
    elevated: "#1A1A26",
  },
  border: "#2A2A3A",
  text: {
    primary: "#F0F0F8",
    secondary: "#8888A8",
    dim: "#4A4A6A",
  },
  accent: {
    live: "#FF3B3B",
    active: "#4A9EFF",
    verified: "#4AE87A",
    heart: "#FF6B8A",
  },
  community: {
    civic: "#4A9EFF",
    diaspora: "#A855F7",
    rural: "#F59E0B",
    policy: "#10B981",
    academic: "#06B6D4",
    cultural: "#F97316",
  },
  map: {
    ocean: "#0D1117",
    land: "#161B22",
  },
  storyRing: {
    start: "#FF6B8A",
    end: "#F59E0B",
  },
} as const;

export type CommunityType = keyof typeof colors.community;

export function communityColor(type: CommunityType): string {
  return colors.community[type] ?? colors.accent.active;
}
