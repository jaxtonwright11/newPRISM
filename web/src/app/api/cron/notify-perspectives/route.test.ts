import { describe, expect, it } from "vitest";
import { buildPerspectiveNotifications } from "./route";

describe("buildPerspectiveNotifications", () => {
  it("deduplicates communities and deep-links to the comparison page", () => {
    const notifications = buildPerspectiveNotifications([
      {
        quote: "First quote from the same community",
        community_id: "community-1",
        community: { name: "River County" },
        topic: { title: "Transit funding", slug: "transit-funding" },
      },
      {
        quote: "Second quote from the same community",
        community_id: "community-1",
        community: { name: "River County" },
        topic: { title: "Transit funding", slug: "transit-funding" },
      },
      {
        quote: "Different community quote",
        community_id: "community-2",
        community: { name: "Hill Workers" },
        topic: { title: "Transit funding", slug: "transit-funding" },
      },
    ]);

    expect(notifications).toEqual([
      {
        communityId: "community-1",
        payload: {
          title: 'New perspective on "Transit funding"',
          body: "2 new perspectives from River County",
          url: "/compare/transit-funding",
          icon: "/icons/icon-192.svg",
        },
      },
      {
        communityId: "community-2",
        payload: {
          title: 'New perspective on "Transit funding"',
          body: "Different community quote",
          url: "/compare/transit-funding",
          icon: "/icons/icon-192.svg",
        },
      },
    ]);
  });

  it("handles Supabase relation arrays and falls back safely without a topic", () => {
    const notifications = buildPerspectiveNotifications([
      {
        quote: "A".repeat(120),
        community_id: "community-1",
        community: [{ name: "Array Community" }],
        topic: [{ title: null, slug: null }],
      },
      {
        quote: "Ignored because community is missing",
        community_id: null,
        community: { name: "No Community" },
        topic: { title: "Ignored", slug: "ignored" },
      },
    ]);

    expect(notifications).toEqual([
      {
        communityId: "community-1",
        payload: {
          title: "Array Community shared a perspective",
          body: "A".repeat(100),
          url: "/feed",
          icon: "/icons/icon-192.svg",
        },
      },
    ]);
  });
});
