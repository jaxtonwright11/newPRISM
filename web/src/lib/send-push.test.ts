import { describe, expect, it } from "vitest";
import { buildWebPushPayload } from "./send-push";

describe("buildWebPushPayload", () => {
  it("places the click target where the service worker reads it", () => {
    const payload = buildWebPushPayload({
      title: "New perspective",
      body: "Tap to compare",
      url: "/compare/local-topic",
      icon: "/icons/icon-192.svg",
    });

    expect(payload.url).toBe("/compare/local-topic");
    expect(payload.data.url).toBe("/compare/local-topic");
    expect(payload.title).toBe("New perspective");
    expect(payload.icon).toBe("/icons/icon-192.svg");
  });

  it("falls back to the feed for missing or unsafe click targets", () => {
    const unsafeUrls = [
      undefined,
      "",
      "compare/local-topic",
      "//evil.example/phish",
      "https://evil.example/phish",
      "javascript:alert(1)",
    ];

    for (const url of unsafeUrls) {
      const payload = buildWebPushPayload({
        title: "PRISM",
        body: "Tap to open",
        url,
      });

      expect(payload.url).toBe("/feed");
      expect(payload.data.url).toBe("/feed");
    }
  });
});
