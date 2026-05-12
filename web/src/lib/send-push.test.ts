import { describe, expect, it } from "vitest";
import { buildPushNotificationPayload } from "./send-push";

describe("buildPushNotificationPayload", () => {
  it("places the click target in notification data for the service worker", () => {
    const payload = buildPushNotificationPayload({
      title: "A new perspective prompt is live",
      body: "Communities are posting now.",
      url: "/compare/topic-slug",
      icon: "/icons/icon-192.svg",
    });

    expect(payload).toMatchObject({
      title: "A new perspective prompt is live",
      body: "Communities are posting now.",
      url: "/compare/topic-slug",
      icon: "/icons/icon-192.svg",
      data: { url: "/compare/topic-slug" },
    });
  });

  it("preserves existing notification data", () => {
    const payload = buildPushNotificationPayload({
      title: "Community milestone",
      body: "A community is active.",
      url: "/community/11111111-1111-4111-8111-111111111111",
      data: { source: "n8n" },
    });

    expect(payload.data).toEqual({
      source: "n8n",
      url: "/community/11111111-1111-4111-8111-111111111111",
    });
  });

  it("falls back to the feed for unsafe click targets", () => {
    const unsafeUrls = [
      "https://evil.example/compare/topic-slug",
      "//evil.example/compare/topic-slug",
      "javascript:alert(1)",
      "\n/feed",
    ];

    unsafeUrls.forEach((url) => {
      const payload = buildPushNotificationPayload({
        title: "Unsafe",
        body: "Should not navigate externally.",
        url,
      });

      expect(payload.url).toBe("/feed");
      expect(payload.data.url).toBe("/feed");
    });
  });
});
