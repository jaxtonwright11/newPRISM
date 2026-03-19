import type { CommunityType } from "@shared/types";

export const COMMUNITY_COLORS: Record<CommunityType, string> = {
  civic: "#4A9EFF",
  diaspora: "#A855F7",
  rural: "#F59E0B",
  policy: "#10B981",
  academic: "#06B6D4",
  cultural: "#F97316",
};

export const REACTION_LABELS = {
  i_see_this: { emoji: "👁", label: "I see this" },
  i_didnt_know_this: { emoji: "💡", label: "I didn't know this" },
  i_agree: { emoji: "🤝", label: "I agree" },
} as const;

export const SEED_TOPICS = [
  {
    title: "US-Mexico Border Policy Changes",
    slug: "us-mexico-border-policy",
    status: "hot" as const,
    perspective_count: 12,
    community_count: 5,
  },
  {
    title: "Remote Work and Rural Economies",
    slug: "remote-work-rural",
    status: "trending" as const,
    perspective_count: 8,
    community_count: 4,
  },
  {
    title: "University Free Speech Debates",
    slug: "university-free-speech",
    status: "active" as const,
    perspective_count: 6,
    community_count: 3,
  },
];

export const SEED_PERSPECTIVES = [
  {
    id: "1",
    community: {
      name: "Rural Appalachia",
      region: "West Virginia",
      community_type: "rural" as CommunityType,
      color_hex: "#F59E0B",
      verified: true,
    },
    topic: "Remote Work and Rural Economies",
    quote:
      "When the tech workers moved in, our coffee shop doubled its prices. But my daughter got a remote job she never could have found here before. It's complicated.",
    context:
      "Community members describe a dual reality where remote work brings opportunity but also displacement in small-town economies.",
    category_tag: "Domestic Policy",
    reaction_count: 47,
  },
  {
    id: "2",
    community: {
      name: "Bay Area Tech Workers",
      region: "San Francisco, CA",
      community_type: "civic" as CommunityType,
      color_hex: "#4A9EFF",
      verified: true,
    },
    topic: "Remote Work and Rural Economies",
    quote:
      "We didn't move to price anyone out. We moved because a two-bedroom here costs what a whole house costs there. We wanted space for our kids.",
    context:
      "Tech workers who relocated to rural areas share their perspective on the economic tension their presence creates.",
    category_tag: "Domestic Policy",
    reaction_count: 34,
  },
  {
    id: "3",
    community: {
      name: "Mexican-American Diaspora",
      region: "El Paso, TX",
      community_type: "diaspora" as CommunityType,
      color_hex: "#A855F7",
      verified: true,
    },
    topic: "US-Mexico Border Policy Changes",
    quote:
      "My family has been crossing this bridge for three generations. It's not a border to us — it's a commute. New policies don't just affect immigrants. They affect families.",
    context:
      "Border communities experience policy changes as disruptions to daily life and generational ties, not abstract political debates.",
    category_tag: "Border",
    reaction_count: 62,
  },
];
