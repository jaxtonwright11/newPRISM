import { describe, expect, it } from "vitest";
import { buildCommunityNotificationPayloads } from "./notification-utils";

describe("buildCommunityNotificationPayloads", () => {
  it("groups by community and deep-links to compare pages when topic slug exists", () => {
    const payloads = buildCommunityNotificationPayloads([
      {
        community_id: "community-1",
        quote: "First quote for community one",
        community: { name: "Coastal Residents" },
        topic: { slug: "water-access", title: "Water Access" },
      },
      {
        community_id: "community-1",
        quote: "Second quote for community one",
        community: { name: "Coastal Residents" },
        topic: { slug: "water-access", title: "Water Access" },
      },
      {
        community_id: "community-2",
        quote: "Single quote for community two",
        community: { name: "Urban Parents" },
        topic: { slug: "public-transit", title: "Public Transit" },
      },
    ]);

    expect(payloads).toEqual([
      {
        communityId: "community-1",
        title: 'New perspective on "Water Access"',
        body: "2 new perspectives from Coastal Residents",
        url: "/compare/water-access",
      },
      {
        communityId: "community-2",
        title: 'New perspective on "Public Transit"',
        body: "Single quote for community two",
        url: "/compare/public-transit",
      },
    ]);
  });

  it("falls back to feed links and preview quotes when topic metadata is missing", () => {
    const longQuote = `${"q".repeat(110)} with extra text`;

    const payloads = buildCommunityNotificationPayloads([
      {
        community_id: "community-3",
        quote: longQuote,
        community: [{ name: "Rural Youth" }],
        topic: [],
      },
      {
        community_id: "community-4",
        quote: "Short quote",
        community: null,
        topic: null,
      },
    ]);

    expect(payloads).toEqual([
      {
        communityId: "community-3",
        title: "Rural Youth shared a perspective",
        body: longQuote.slice(0, 100),
        url: "/feed",
      },
      {
        communityId: "community-4",
        title: "A community shared a perspective",
        body: "Short quote",
        url: "/feed",
      },
    ]);
  });
});
