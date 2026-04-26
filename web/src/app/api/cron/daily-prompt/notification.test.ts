import { describe, expect, it } from "vitest";
import { buildDailyPromptNotification } from "./notification";

describe("buildDailyPromptNotification", () => {
  it("deep-links daily prompt pushes to the comparison view for object topic relations", () => {
    const notification = buildDailyPromptNotification(
      {
        topic: {
          title: "Water access",
          slug: "water-access",
        },
      },
      3
    );

    expect(notification).toEqual({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Water access right now. 3 perspectives so far today.",
      url: "/compare/water-access",
      topicName: "Water access",
    });
  });

  it("handles Supabase single-item relation arrays without losing the compare deep-link", () => {
    const notification = buildDailyPromptNotification(
      {
        topic: [
          {
            title: "Downtown transit",
            slug: "downtown-transit",
          },
        ],
      },
      null
    );

    expect(notification.body).toBe(
      "Communities are posting about Downtown transit right now. 0 perspectives so far today."
    );
    expect(notification.url).toBe("/compare/downtown-transit");
    expect(notification.topicName).toBe("Downtown transit");
  });

  it("falls back to the feed and generic topic name when the prompt has no topic slug", () => {
    const notification = buildDailyPromptNotification(
      {
        topic: null,
      },
      1
    );

    expect(notification).toMatchObject({
      body: "Communities are posting about today's topic right now. 1 perspectives so far today.",
      url: "/feed",
      topicName: "today's topic",
    });
  });
});
