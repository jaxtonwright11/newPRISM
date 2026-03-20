import type {
  Community,
  Topic,
  CommunityAlignment,
  MapPin,
  CommunityType,
} from "@shared/types";

export const SEED_COMMUNITIES: Community[] = [
  {
    id: "comm-rural-appalachia",
    name: "Rural Appalachia",
    region: "West Virginia",
    country: "US",
    latitude: 38.35,
    longitude: -81.63,
    community_type: "rural",
    color_hex: "#F59E0B",
    description:
      "Coal country families navigating economic transition and the arrival of remote workers.",
    verified: true,
    active: true,
  },
  {
    id: "comm-bay-area-tech",
    name: "Bay Area Tech Workers",
    region: "San Francisco, CA",
    country: "US",
    latitude: 37.77,
    longitude: -122.42,
    community_type: "civic",
    color_hex: "#4A9EFF",
    description:
      "Tech professionals balancing innovation culture with cost-of-living realities.",
    verified: true,
    active: true,
  },
  {
    id: "comm-mexican-american",
    name: "Mexican-American Diaspora",
    region: "El Paso, TX",
    country: "US",
    latitude: 31.76,
    longitude: -106.49,
    community_type: "diaspora",
    color_hex: "#A855F7",
    description:
      "Families with deep ties across the US-Mexico border, living the reality of immigration policy.",
    verified: true,
    active: true,
  },
  {
    id: "comm-policy-dc",
    name: "Policy Wonks DC",
    region: "Washington, DC",
    country: "US",
    latitude: 38.91,
    longitude: -77.04,
    community_type: "policy",
    color_hex: "#10B981",
    description:
      "Think-tank analysts and policy staffers tracking legislation and its real-world impact.",
    verified: true,
    active: true,
  },
  {
    id: "comm-academic-economists",
    name: "Academic Economists",
    region: "Boston, MA",
    country: "US",
    latitude: 42.36,
    longitude: -71.06,
    community_type: "academic",
    color_hex: "#06B6D4",
    description:
      "Researchers studying labor markets, migration, and the economics of remote work.",
    verified: true,
    active: true,
  },
  {
    id: "comm-rural-border",
    name: "Rural Border Towns",
    region: "Nogales, AZ",
    country: "US",
    latitude: 31.34,
    longitude: -110.94,
    community_type: "rural",
    color_hex: "#F59E0B",
    description:
      "Small towns along the southern border where trade, culture, and policy collide daily.",
    verified: true,
    active: true,
  },
  {
    id: "comm-hbcu-students",
    name: "HBCU Student Voices",
    region: "Atlanta, GA",
    country: "US",
    latitude: 33.75,
    longitude: -84.39,
    community_type: "academic",
    color_hex: "#06B6D4",
    description:
      "Students at historically Black colleges navigating free speech, tradition, and activism.",
    verified: true,
    active: true,
  },
  {
    id: "comm-native-tribal",
    name: "Tribal Nations Midwest",
    region: "Pine Ridge, SD",
    country: "US",
    latitude: 43.01,
    longitude: -102.55,
    community_type: "cultural",
    color_hex: "#F97316",
    description:
      "Indigenous communities preserving sovereignty while engaging with federal policy.",
    verified: true,
    active: true,
  },
  {
    id: "comm-detroit-labor",
    name: "Detroit Auto Workers",
    region: "Detroit, MI",
    country: "US",
    latitude: 42.33,
    longitude: -83.05,
    community_type: "civic",
    color_hex: "#4A9EFF",
    description:
      "Union workers in the automotive industry facing automation and the EV transition.",
    verified: true,
    active: true,
  },
  {
    id: "comm-miami-cuban",
    name: "Cuban-American Miami",
    region: "Miami, FL",
    country: "US",
    latitude: 25.76,
    longitude: -80.19,
    community_type: "diaspora",
    color_hex: "#A855F7",
    description:
      "Multi-generational Cuban-American community with deep perspectives on immigration and identity.",
    verified: true,
    active: true,
  },
  {
    id: "comm-farm-workers",
    name: "Central Valley Farm Workers",
    region: "Fresno, CA",
    country: "US",
    latitude: 36.74,
    longitude: -119.77,
    community_type: "rural",
    color_hex: "#F59E0B",
    description:
      "Agricultural laborers whose livelihoods depend on immigration policy and water rights.",
    verified: true,
    active: true,
  },
  {
    id: "comm-climate-coastal",
    name: "Coastal Climate Communities",
    region: "Norfolk, VA",
    country: "US",
    latitude: 36.85,
    longitude: -76.29,
    community_type: "civic",
    color_hex: "#4A9EFF",
    description:
      "Residents of flood-prone coastal areas experiencing climate change firsthand.",
    verified: true,
    active: true,
  },
];

export const SEED_TOPICS: Topic[] = [
  {
    id: "topic-border-policy",
    title: "US-Mexico Border Policy Changes",
    slug: "us-mexico-border-policy",
    summary:
      "How different communities experience shifts in immigration enforcement and cross-border life.",
    status: "hot",
    perspective_count: 12,
    community_count: 5,
    created_at: "2026-03-10T00:00:00Z",
    updated_at: "2026-03-19T00:00:00Z",
  },
  {
    id: "topic-remote-work",
    title: "Remote Work and Rural Economies",
    slug: "remote-work-rural",
    summary:
      "The ripple effects of urban workers relocating to small towns — opportunity, displacement, and cultural shift.",
    status: "trending",
    perspective_count: 8,
    community_count: 4,
    created_at: "2026-03-08T00:00:00Z",
    updated_at: "2026-03-18T00:00:00Z",
  },
  {
    id: "topic-free-speech",
    title: "University Free Speech Debates",
    slug: "university-free-speech",
    summary:
      "Campus communities wrestle with the boundaries of expression, protest, and institutional responses.",
    status: "active",
    perspective_count: 6,
    community_count: 3,
    created_at: "2026-03-05T00:00:00Z",
    updated_at: "2026-03-17T00:00:00Z",
  },
  {
    id: "topic-ev-transition",
    title: "Electric Vehicle Transition",
    slug: "ev-transition",
    summary:
      "Auto workers, rural drivers, and policy makers see the EV shift through very different lenses.",
    status: "trending",
    perspective_count: 9,
    community_count: 4,
    created_at: "2026-03-12T00:00:00Z",
    updated_at: "2026-03-19T00:00:00Z",
  },
  {
    id: "topic-water-rights",
    title: "Western Water Rights Crisis",
    slug: "water-rights-crisis",
    summary:
      "Farmers, tribal nations, and cities compete for a shrinking resource in the American West.",
    status: "hot",
    perspective_count: 11,
    community_count: 5,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-19T00:00:00Z",
  },
  {
    id: "topic-climate-flooding",
    title: "Coastal Flooding and Climate Migration",
    slug: "coastal-flooding-climate",
    summary:
      "Communities facing rising seas debate whether to adapt, relocate, or fight for federal support.",
    status: "active",
    perspective_count: 7,
    community_count: 3,
    created_at: "2026-03-06T00:00:00Z",
    updated_at: "2026-03-16T00:00:00Z",
  },
];

interface SeedPerspective {
  id: string;
  community_id: string;
  topic_slug: string;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
  topic: string;
  quote: string;
  context: string;
  category_tag: string;
  reaction_count: number;
  bookmark_count: number;
  created_at: string;
}

export const SEED_PERSPECTIVES: SeedPerspective[] = [
  // --- Border Policy ---
  {
    id: "persp-1",
    community_id: "comm-mexican-american",
    topic_slug: "us-mexico-border-policy",
    community: {
      name: "Mexican-American Diaspora",
      region: "El Paso, TX",
      community_type: "diaspora",
      color_hex: "#A855F7",
      verified: true,
    },
    topic: "US-Mexico Border Policy Changes",
    quote:
      "My family has been crossing this bridge for three generations. It's not a border to us — it's a commute. New policies don't just affect immigrants. They affect families.",
    context:
      "Border communities experience policy changes as disruptions to daily life and generational ties, not abstract political debates.",
    category_tag: "Immigration",
    reaction_count: 62,
    bookmark_count: 18,
    created_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "persp-2",
    community_id: "comm-rural-border",
    topic_slug: "us-mexico-border-policy",
    community: {
      name: "Rural Border Towns",
      region: "Nogales, AZ",
      community_type: "rural",
      color_hex: "#F59E0B",
      verified: true,
    },
    topic: "US-Mexico Border Policy Changes",
    quote:
      "Half our town's economy depends on cross-border trade. When they shut the port of entry for even a day, the local grocery store feels it.",
    context:
      "Small border towns depend on binational commerce. Policy changes have immediate economic ripple effects that rarely make national news.",
    category_tag: "Economy",
    reaction_count: 41,
    bookmark_count: 12,
    created_at: "2026-03-14T14:00:00Z",
  },
  {
    id: "persp-3",
    community_id: "comm-policy-dc",
    topic_slug: "us-mexico-border-policy",
    community: {
      name: "Policy Wonks DC",
      region: "Washington, DC",
      community_type: "policy",
      color_hex: "#10B981",
      verified: true,
    },
    topic: "US-Mexico Border Policy Changes",
    quote:
      "The data shows that border crossings respond more to conditions in origin countries than to U.S. enforcement levels. But that nuance never makes it into the debate.",
    context:
      "Policy researchers highlight the gap between evidence-based analysis and political rhetoric on border security.",
    category_tag: "Policy Analysis",
    reaction_count: 38,
    bookmark_count: 22,
    created_at: "2026-03-13T09:00:00Z",
  },
  {
    id: "persp-4",
    community_id: "comm-farm-workers",
    topic_slug: "us-mexico-border-policy",
    community: {
      name: "Central Valley Farm Workers",
      region: "Fresno, CA",
      community_type: "rural",
      color_hex: "#F59E0B",
      verified: true,
    },
    topic: "US-Mexico Border Policy Changes",
    quote:
      "Every time they announce a crackdown, half my crew doesn't show up the next day. It's not because they're undocumented — they're afraid they'll be treated like they are.",
    context:
      "Agricultural communities describe a chilling effect where enforcement rhetoric impacts legal workers and documented immigrants alike.",
    category_tag: "Labor",
    reaction_count: 55,
    bookmark_count: 15,
    created_at: "2026-03-12T11:30:00Z",
  },

  // --- Remote Work ---
  {
    id: "persp-5",
    community_id: "comm-rural-appalachia",
    topic_slug: "remote-work-rural",
    community: {
      name: "Rural Appalachia",
      region: "West Virginia",
      community_type: "rural",
      color_hex: "#F59E0B",
      verified: true,
    },
    topic: "Remote Work and Rural Economies",
    quote:
      "When the tech workers moved in, our coffee shop doubled its prices. But my daughter got a remote job she never could have found here before. It's complicated.",
    context:
      "Community members describe a dual reality where remote work brings opportunity but also displacement in small-town economies.",
    category_tag: "Economy",
    reaction_count: 47,
    bookmark_count: 20,
    created_at: "2026-03-16T08:00:00Z",
  },
  {
    id: "persp-6",
    community_id: "comm-bay-area-tech",
    topic_slug: "remote-work-rural",
    community: {
      name: "Bay Area Tech Workers",
      region: "San Francisco, CA",
      community_type: "civic",
      color_hex: "#4A9EFF",
      verified: true,
    },
    topic: "Remote Work and Rural Economies",
    quote:
      "We didn't move to price anyone out. We moved because a two-bedroom here costs what a whole house costs there. We wanted space for our kids.",
    context:
      "Tech workers who relocated to rural areas share their perspective on the economic tension their presence creates.",
    category_tag: "Housing",
    reaction_count: 34,
    bookmark_count: 9,
    created_at: "2026-03-15T16:00:00Z",
  },
  {
    id: "persp-7",
    community_id: "comm-academic-economists",
    topic_slug: "remote-work-rural",
    community: {
      name: "Academic Economists",
      region: "Boston, MA",
      community_type: "academic",
      color_hex: "#06B6D4",
      verified: true,
    },
    topic: "Remote Work and Rural Economies",
    quote:
      "Our models show remote work could reverse fifty years of rural population decline — but only if broadband infrastructure keeps pace. Right now, it isn't.",
    context:
      "Economists see remote work as a historic opportunity for rural revitalization, with a critical infrastructure bottleneck.",
    category_tag: "Research",
    reaction_count: 29,
    bookmark_count: 16,
    created_at: "2026-03-14T12:00:00Z",
  },
  {
    id: "persp-8",
    community_id: "comm-native-tribal",
    topic_slug: "remote-work-rural",
    community: {
      name: "Tribal Nations Midwest",
      region: "Pine Ridge, SD",
      community_type: "cultural",
      color_hex: "#F97316",
      verified: true,
    },
    topic: "Remote Work and Rural Economies",
    quote:
      "Everyone talks about rural broadband like it's new. We've been asking for basic internet access for twenty years. Remote work just made other people care.",
    context:
      "Indigenous communities point out that the digital divide they've long experienced is only now getting attention because it affects urban transplants.",
    category_tag: "Infrastructure",
    reaction_count: 58,
    bookmark_count: 24,
    created_at: "2026-03-13T10:00:00Z",
  },

  // --- Free Speech ---
  {
    id: "persp-9",
    community_id: "comm-hbcu-students",
    topic_slug: "university-free-speech",
    community: {
      name: "HBCU Student Voices",
      region: "Atlanta, GA",
      community_type: "academic",
      color_hex: "#06B6D4",
      verified: true,
    },
    topic: "University Free Speech Debates",
    quote:
      "Free speech on our campus has always meant something different. We weren't founded to debate whether we deserve rights — we were founded because we were denied them.",
    context:
      "HBCU students frame the free speech debate through the lens of institutional history and the purpose of Black educational spaces.",
    category_tag: "Education",
    reaction_count: 71,
    bookmark_count: 28,
    created_at: "2026-03-17T09:00:00Z",
  },
  {
    id: "persp-10",
    community_id: "comm-policy-dc",
    topic_slug: "university-free-speech",
    community: {
      name: "Policy Wonks DC",
      region: "Washington, DC",
      community_type: "policy",
      color_hex: "#10B981",
      verified: true,
    },
    topic: "University Free Speech Debates",
    quote:
      "There's a meaningful legal distinction between government censorship and a university choosing who speaks on its campus. Most of this debate conflates the two.",
    context:
      "Legal policy experts distinguish between First Amendment protections and institutional editorial decisions in the campus speech debate.",
    category_tag: "Legal",
    reaction_count: 33,
    bookmark_count: 14,
    created_at: "2026-03-16T15:00:00Z",
  },

  // --- EV Transition ---
  {
    id: "persp-11",
    community_id: "comm-detroit-labor",
    topic_slug: "ev-transition",
    community: {
      name: "Detroit Auto Workers",
      region: "Detroit, MI",
      community_type: "civic",
      color_hex: "#4A9EFF",
      verified: true,
    },
    topic: "Electric Vehicle Transition",
    quote:
      "An EV engine has seventeen moving parts. A gas engine has two thousand. You don't need a math degree to know what that means for our jobs.",
    context:
      "Auto workers face the reality that EV manufacturing requires dramatically fewer labor hours per vehicle.",
    category_tag: "Labor",
    reaction_count: 89,
    bookmark_count: 35,
    created_at: "2026-03-18T08:00:00Z",
  },
  {
    id: "persp-12",
    community_id: "comm-rural-appalachia",
    topic_slug: "ev-transition",
    community: {
      name: "Rural Appalachia",
      region: "West Virginia",
      community_type: "rural",
      color_hex: "#F59E0B",
      verified: true,
    },
    topic: "Electric Vehicle Transition",
    quote:
      "The nearest charging station is ninety miles away. Tell me again how EVs are the future for everyone.",
    context:
      "Rural communities highlight the infrastructure gap that makes electric vehicles impractical outside urban and suburban corridors.",
    category_tag: "Infrastructure",
    reaction_count: 64,
    bookmark_count: 19,
    created_at: "2026-03-17T14:00:00Z",
  },
  {
    id: "persp-13",
    community_id: "comm-academic-economists",
    topic_slug: "ev-transition",
    community: {
      name: "Academic Economists",
      region: "Boston, MA",
      community_type: "academic",
      color_hex: "#06B6D4",
      verified: true,
    },
    topic: "Electric Vehicle Transition",
    quote:
      "The transition cost isn't just in new factories — it's in retraining a workforce whose skills were built over generations. The investment timeline is decades, not quarters.",
    context:
      "Economists warn that the human capital costs of the EV transition are being systematically underestimated in industry projections.",
    category_tag: "Research",
    reaction_count: 42,
    bookmark_count: 21,
    created_at: "2026-03-16T11:00:00Z",
  },

  // --- Water Rights ---
  {
    id: "persp-14",
    community_id: "comm-native-tribal",
    topic_slug: "water-rights-crisis",
    community: {
      name: "Tribal Nations Midwest",
      region: "Pine Ridge, SD",
      community_type: "cultural",
      color_hex: "#F97316",
      verified: true,
    },
    topic: "Western Water Rights Crisis",
    quote:
      "Our water rights predate every state in the West. But somehow, every time there's a shortage, we're the last ones at the table.",
    context:
      "Tribal nations hold some of the oldest water rights in the American West but face persistent barriers to enforcement and allocation.",
    category_tag: "Sovereignty",
    reaction_count: 76,
    bookmark_count: 30,
    created_at: "2026-03-18T10:00:00Z",
  },
  {
    id: "persp-15",
    community_id: "comm-farm-workers",
    topic_slug: "water-rights-crisis",
    community: {
      name: "Central Valley Farm Workers",
      region: "Fresno, CA",
      community_type: "rural",
      color_hex: "#F59E0B",
      verified: true,
    },
    topic: "Western Water Rights Crisis",
    quote:
      "When the water cuts come, it's always the small farms first. The big operations have lawyers. We have calluses.",
    context:
      "Small-scale agricultural workers bear a disproportionate burden of water allocation cuts in drought-stricken regions.",
    category_tag: "Agriculture",
    reaction_count: 51,
    bookmark_count: 17,
    created_at: "2026-03-17T09:00:00Z",
  },
  {
    id: "persp-16",
    community_id: "comm-policy-dc",
    topic_slug: "water-rights-crisis",
    community: {
      name: "Policy Wonks DC",
      region: "Washington, DC",
      community_type: "policy",
      color_hex: "#10B981",
      verified: true,
    },
    topic: "Western Water Rights Crisis",
    quote:
      "The Colorado River Compact was written in 1922 using the wettest decade on record as a baseline. We've been over-allocating a resource that was never as abundant as we assumed.",
    context:
      "Policy analysts trace the current crisis to century-old legal frameworks built on flawed hydrological assumptions.",
    category_tag: "Policy Analysis",
    reaction_count: 45,
    bookmark_count: 26,
    created_at: "2026-03-15T13:00:00Z",
  },

  // --- Coastal Flooding ---
  {
    id: "persp-17",
    community_id: "comm-climate-coastal",
    topic_slug: "coastal-flooding-climate",
    community: {
      name: "Coastal Climate Communities",
      region: "Norfolk, VA",
      community_type: "civic",
      color_hex: "#4A9EFF",
      verified: true,
    },
    topic: "Coastal Flooding and Climate Migration",
    quote:
      "My basement floods every king tide now. Insurance won't cover it anymore. But this house has been in my family for four generations — I can't just leave.",
    context:
      "Coastal residents face impossible choices between financial ruin and abandoning generational homes to rising seas.",
    category_tag: "Climate",
    reaction_count: 53,
    bookmark_count: 19,
    created_at: "2026-03-16T08:00:00Z",
  },
  {
    id: "persp-18",
    community_id: "comm-miami-cuban",
    topic_slug: "coastal-flooding-climate",
    community: {
      name: "Cuban-American Miami",
      region: "Miami, FL",
      community_type: "diaspora",
      color_hex: "#A855F7",
      verified: true,
    },
    topic: "Coastal Flooding and Climate Migration",
    quote:
      "Our parents fled one island for another. Now they're telling us this one might flood too. The irony isn't lost on us.",
    context:
      "Miami's diaspora communities see sea-level rise through the lens of displacement they've already experienced once before.",
    category_tag: "Identity",
    reaction_count: 67,
    bookmark_count: 23,
    created_at: "2026-03-15T12:00:00Z",
  },
];

export const SEED_ALIGNMENTS: CommunityAlignment[] = [
  {
    id: "align-1",
    topic_id: "topic-border-policy",
    alignment_statement:
      "Border communities need more direct federal engagement, not just enforcement presence",
    community_ids: [
      "comm-mexican-american",
      "comm-rural-border",
      "comm-policy-dc",
    ],
    agreement_pct: 87,
  },
  {
    id: "align-2",
    topic_id: "topic-border-policy",
    alignment_statement:
      "Policy changes should account for existing cross-border economic relationships",
    community_ids: [
      "comm-rural-border",
      "comm-farm-workers",
      "comm-mexican-american",
      "comm-academic-economists",
    ],
    agreement_pct: 82,
  },
  {
    id: "align-3",
    topic_id: "topic-remote-work",
    alignment_statement:
      "Remote work has permanently changed the relationship between cities and rural areas",
    community_ids: [
      "comm-rural-appalachia",
      "comm-bay-area-tech",
      "comm-academic-economists",
    ],
    agreement_pct: 74,
  },
  {
    id: "align-4",
    topic_id: "topic-remote-work",
    alignment_statement:
      "Broadband infrastructure is the key bottleneck for rural economic development",
    community_ids: [
      "comm-rural-appalachia",
      "comm-native-tribal",
      "comm-academic-economists",
      "comm-policy-dc",
    ],
    agreement_pct: 91,
  },
  {
    id: "align-5",
    topic_id: "topic-free-speech",
    alignment_statement:
      "Universities should foster open dialogue while protecting students from targeted harassment",
    community_ids: ["comm-hbcu-students", "comm-policy-dc"],
    agreement_pct: 79,
  },
  {
    id: "align-6",
    topic_id: "topic-ev-transition",
    alignment_statement:
      "Worker retraining programs must be funded before plant closures, not after",
    community_ids: [
      "comm-detroit-labor",
      "comm-academic-economists",
      "comm-policy-dc",
    ],
    agreement_pct: 93,
  },
  {
    id: "align-7",
    topic_id: "topic-ev-transition",
    alignment_statement:
      "EV infrastructure must reach rural areas for the transition to be equitable",
    community_ids: [
      "comm-rural-appalachia",
      "comm-detroit-labor",
      "comm-native-tribal",
    ],
    agreement_pct: 86,
  },
  {
    id: "align-8",
    topic_id: "topic-water-rights",
    alignment_statement:
      "Tribal water rights must be honored as part of any western water reallocation",
    community_ids: [
      "comm-native-tribal",
      "comm-policy-dc",
      "comm-academic-economists",
    ],
    agreement_pct: 88,
  },
  {
    id: "align-9",
    topic_id: "topic-water-rights",
    alignment_statement:
      "Agricultural water allocation needs reform to protect small farms from bearing disproportionate cuts",
    community_ids: [
      "comm-farm-workers",
      "comm-native-tribal",
      "comm-policy-dc",
    ],
    agreement_pct: 81,
  },
  {
    id: "align-10",
    topic_id: "topic-climate-flooding",
    alignment_statement:
      "Federal flood insurance reform should prioritize communities that cannot afford to relocate",
    community_ids: [
      "comm-climate-coastal",
      "comm-miami-cuban",
      "comm-policy-dc",
    ],
    agreement_pct: 84,
  },
];

export const SEED_MAP_PINS: MapPin[] = SEED_COMMUNITIES.filter(
  (c) => c.latitude !== null && c.longitude !== null
).map((c) => ({
  id: `pin-${c.id}`,
  type: "community" as const,
  latitude: c.latitude as number,
  longitude: c.longitude as number,
  color_hex: c.color_hex,
  community_type: c.community_type,
  activity_level: (["high", "medium", "low"] as const)[
    Math.floor(Math.abs(c.latitude as number) % 3)
  ],
  community: c,
}));

export function getPerspectivesByTopic(slug: string): SeedPerspective[] {
  return SEED_PERSPECTIVES.filter((p) => p.topic_slug === slug);
}

export function getAlignmentsByTopic(topicId: string): CommunityAlignment[] {
  return SEED_ALIGNMENTS.filter((a) => a.topic_id === topicId);
}

export function getTopicBySlug(slug: string): Topic | undefined {
  return SEED_TOPICS.find((t) => t.slug === slug);
}

export function getCommunityById(id: string): Community | undefined {
  return SEED_COMMUNITIES.find((c) => c.id === id);
}

export function getCommunityByName(name: string): Community | undefined {
  return SEED_COMMUNITIES.find((c) => c.name === name);
}
