import { describe, expect, it } from "vitest";
import {
  buildCommunityNotificationPayloads,
  type NotificationPerspectiveRow,
} from "./notification-payload";

describe("buildCommunityNotificationPayloads", () => {
  it("groups rows by community and builds compare deep links", () => {
    const rows: NotificationPerspectiveRow[] = [
      {
        quote: "Quote one",
        community_id: "community-a",
        community: { name: "Northside" },
        topic: { title: "Transit Funding", slug: "transit-funding" },
      },
      {
        quote: "Quote two",
        community_id: "community-a",
        community: { name: "Northside" },
        topic: { title: "Transit Funding", slug: "transit-funding" },
      },
      {
        quote: "Another quote",
        community_id: "community-b",
        community: { name: "Southside" },
        topic: { title: "School Budget", slug: "school-budget" },
      },
    ];

    const payloads = buildCommunityNotificationPayloads(rows);

    expect(payloads).toHaveLength(2);
    expect(payloads).toEqual([
      {
        communityId: "community-a",
        title: 'New perspective on "Transit Funding"',
        body: "2 new perspectives from Northside",
        url: "/compare/transit-funding",
      },
      {
        communityId: "community-b",
        title: 'New perspective on "School Budget"',
        body: "Another quote",
        url: "/compare/school-budget",
      },
    ]);
  });

  it("handles array relations, missing topic slug, and missing community ids safely", () => {
    const longQuote = "x".repeat(180);
    const rows: NotificationPerspectiveRow[] = [
      {
        quote: longQuote,
        community_id: "community-a",
        community: [{ name: "Metro East" }],
        topic: [{ title: "Housing Costs", slug: "housing-costs" }],
      },
      {
        quote: "No topic slug here",
        community_id: "community-c",
        community: [{ name: "Riverside" }],
        topic: [{ title: "Unknown", slug: "" }],
      },
      {
        quote: "Ignored because no community",
        community_id: null,
        community: { name: "Nobody" },
        topic: { title: "Ignored", slug: "ignored" },
      },
    ];

    const payloads = buildCommunityNotificationPayloads(rows);

    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toMatchObject({
      communityId: "community-a",
      title: 'New perspective on "Housing Costs"',
      url: "/compare/housing-costs",
    });
    expect(payloads[0].body).toBe("x".repeat(100));

    expect(payloads[1]).toEqual({
      communityId: "community-c",
      title: 'New perspective on "Unknown"',
      body: "No topic slug here",
      url: "/feed",
    });
  });
});
