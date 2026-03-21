// Seed data for mobile app — mirrors web seed data for consistent experience
import type { CommunityType } from "../theme";

export interface SeedCommunity {
  id: string;
  name: string;
  region: string;
  community_type: CommunityType;
  color_hex: string;
  latitude: number;
  longitude: number;
  verified: boolean;
}

export interface SeedPerspective {
  id: string;
  quote: string;
  context: string;
  category_tag: string;
  reaction_count: number;
  bookmark_count: number;
  community: SeedCommunity;
  created_at: string;
}

export interface SeedTopic {
  id: string;
  title: string;
  slug: string;
  status: "active" | "trending" | "hot";
  perspective_count: number;
  community_count: number;
}

export const SEED_TOPICS: SeedTopic[] = [
  {
    id: "t1",
    title: "Housing Crisis",
    slug: "housing-crisis",
    status: "hot",
    perspective_count: 12,
    community_count: 5,
  },
  {
    id: "t2",
    title: "Local Food Systems",
    slug: "local-food-systems",
    status: "active",
    perspective_count: 8,
    community_count: 4,
  },
  {
    id: "t3",
    title: "Youth Mental Health",
    slug: "youth-mental-health",
    status: "trending",
    perspective_count: 15,
    community_count: 6,
  },
];

export const SEED_COMMUNITIES: SeedCommunity[] = [
  {
    id: "c1",
    name: "South Side Chicago",
    region: "Chicago, IL",
    community_type: "civic",
    color_hex: "#4A9EFF",
    latitude: 41.75,
    longitude: -87.65,
    verified: true,
  },
  {
    id: "c2",
    name: "Rural Appalachia",
    region: "Eastern Kentucky",
    community_type: "rural",
    color_hex: "#F59E0B",
    latitude: 37.5,
    longitude: -83.5,
    verified: true,
  },
  {
    id: "c3",
    name: "Somali-Canadian Toronto",
    region: "Toronto, ON",
    community_type: "diaspora",
    color_hex: "#A855F7",
    latitude: 43.7,
    longitude: -79.4,
    verified: true,
  },
  {
    id: "c4",
    name: "Bay Area Policy Institute",
    region: "San Francisco, CA",
    community_type: "policy",
    color_hex: "#10B981",
    latitude: 37.77,
    longitude: -122.42,
    verified: true,
  },
  {
    id: "c5",
    name: "Howard University",
    region: "Washington, DC",
    community_type: "academic",
    color_hex: "#06B6D4",
    latitude: 38.92,
    longitude: -77.02,
    verified: true,
  },
];

export const SEED_PERSPECTIVES: SeedPerspective[] = [
  {
    id: "p1",
    quote: "We've been talking about affordable housing for decades, but nobody asks us what affordable even means when your whole block is getting bought up.",
    context: "Community organizer reflecting on displacement patterns in South Side neighborhoods where longtime residents are being priced out by new developments.",
    category_tag: "lived experience",
    reaction_count: 234,
    bookmark_count: 45,
    community: SEED_COMMUNITIES[0],
    created_at: new Date().toISOString(),
  },
  {
    id: "p2",
    quote: "Out here, the housing crisis isn't about prices going up — it's about houses falling apart and nobody coming to fix them.",
    context: "Rural resident describing how housing decay, not gentrification, defines the crisis in Appalachian communities where infrastructure investment has been absent for decades.",
    category_tag: "lived experience",
    reaction_count: 189,
    bookmark_count: 38,
    community: SEED_COMMUNITIES[1],
    created_at: new Date().toISOString(),
  },
  {
    id: "p3",
    quote: "When my family arrived, they told us 'affordable housing' meant a basement apartment shared with two other families. That was the Canadian dream for us.",
    context: "Somali-Canadian resident sharing the immigrant experience of navigating housing systems designed without their community in mind.",
    category_tag: "diaspora voice",
    reaction_count: 312,
    bookmark_count: 67,
    community: SEED_COMMUNITIES[2],
    created_at: new Date().toISOString(),
  },
  {
    id: "p4",
    quote: "The data shows a 40% gap between median income and median rent in urban cores. But data doesn't capture what it feels like to choose between food and shelter.",
    context: "Policy researcher acknowledging the limits of quantitative analysis when addressing housing as a human crisis.",
    category_tag: "policy analysis",
    reaction_count: 156,
    bookmark_count: 29,
    community: SEED_COMMUNITIES[3],
    created_at: new Date().toISOString(),
  },
  {
    id: "p5",
    quote: "We study housing policy in class, then walk back to dorms that cost more than my parents' mortgage. The irony isn't lost on anyone.",
    context: "University student connecting academic study of housing inequality to their own lived reality as a student facing rising education costs.",
    category_tag: "academic",
    reaction_count: 201,
    bookmark_count: 41,
    community: SEED_COMMUNITIES[4],
    created_at: new Date().toISOString(),
  },
];
