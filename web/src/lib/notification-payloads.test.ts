import { describe, expect, it } from "vitest";
import {
  buildCommunityPerspectiveNotifications,
  buildDailyPromptNotification,
} from "./notification-payloads";

describe("buildDailyPromptNotification", () => {
  it("deep-links prompt notifications to the comparison page for object topic relations", () => {
    const notification = buildDailyPromptNotification(
      {
        id: "prompt-1",
        topic: {
          title: "Housing costs",
          slug: "housing-costs",
        },
      },
      7
    );

    expect(notification).toEqual({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Housing costs right now. 7 perspectives so far today.",
      url: "/compare/housing-costs",
      topicName: "Housing costs",
    });
  });

  it("unwraps array topic relations and falls back to feed when a topic slug is missing", () => {
    const notification = buildDailyPromptNotification(
      {
        id: "prompt-2",
        topic: [
          {
            title: "Transit access",
            slug: null,
          },
        ],
      },
      null
    );

    expect(notification).toMatchObject({
      body: "Communities are posting about Transit access right now. 0 perspectives so far today.",
      url: "/feed",
      topicName: "Transit access",
    });
  });
});

describe("buildCommunityPerspectiveNotifications", () => {
  it("groups perspectives by community and deep-links each notification to the comparison page", () => {
    const notifications = buildCommunityPerspectiveNotifications([
      {
        quote: "This changed how our neighborhood talks about housing.",
        community_id: "community-1",
        community: { name: "Southside neighbors" },
        topic: { title: "Housing costs", slug: "housing-costs" },
      },
      {
        quote: "A second perspective from the same community should be counted.",
        community_id: "community-1",
        community: { name: "Southside neighbors" },
        topic: { title: "Housing costs", slug: "housing-costs" },
      },
      {
        quote: "Our rural transit route changes every commute.",
        community_id: "community-2",
        community: [{ name: "Rural commuters" }],
        topic: [{ title: "Transit access", slug: "transit-access" }],
      },
    ]);

    expect(notifications).toEqual([
      {
        communityId: "community-1",
        title: 'New perspective on "Housing costs"',
        body: "2 new perspectives from Southside neighbors",
        url: "/compare/housing-costs",
        icon: "/icons/icon-192.svg",
      },
      {
        communityId: "community-2",
        title: 'New perspective on "Transit access"',
        body: "Our rural transit route changes every commute.",
        url: "/compare/transit-access",
        icon: "/icons/icon-192.svg",
      },
    ]);
  });

  it("skips perspectives without a community and falls back when relation data is missing", () => {
    const notifications = buildCommunityPerspectiveNotifications([
      {
        quote: "No community id means there is nobody to notify.",
        community_id: null,
        community: { name: "Ignored community" },
        topic: { title: "Ignored topic", slug: "ignored-topic" },
      },
      {
        quote:
          "This quote is intentionally longer than one hundred characters so the single-perspective notification body is trimmed.",
        community_id: "community-3",
        community: null,
        topic: [],
      },
    ]);

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual({
      communityId: "community-3",
      title: "A community shared a perspective",
      body: "This quote is intentionally longer than one hundred characters so the single-perspective notification body is",
      url: "/feed",
      icon: "/icons/icon-192.svg",
    });
  });
});
